import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const bucket = "idoldays-media";

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function storagePath(value: string | null | undefined) {
  return value?.startsWith("storage:")
    ? value.slice("storage:".length)
    : null;
}

function storageRef(path: string) {
  return `storage:${path}`;
}

function filename(path: string) {
  return path.split("/").at(-1) || "photo";
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

async function objectExists(
  admin: ReturnType<typeof createClient>,
  path: string,
) {
  const parts = path.split("/");
  const name = parts.pop();

  if (!name) return false;

  const folder = parts.join("/");

  const { data, error } = await admin.storage
    .from(bucket)
    .list(folder, {
      limit: 100,
      search: name,
    });

  if (error) throw error;

  return (data ?? []).some((item) => item.name === name);
}

async function ensureCopied(
  admin: ReturnType<typeof createClient>,
  sourcePath: string,
  destinationPath: string,
) {
  const exists = await objectExists(admin, destinationPath);

  if (exists) {
    return "existing" as const;
  }

  const { error } = await admin.storage
    .from(bucket)
    .copy(sourcePath, destinationPath);

  if (error) throw error;

  return "copied" as const;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Not found" }, 404);
  }

  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return json({ error: "Authentication required" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error("Supabase function environment is incomplete");
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
      auth: {
        persistSession: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return json({ error: "Authentication required" }, 401);
    }

    const body = await request.json().catch(() => null);

    const shareId = body?.shareId;
    const folderId = body?.folderId;

    if (!isUuid(shareId) || !isUuid(folderId)) {
      return json({ error: "Invalid share claim" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    const { data: claim, error: claimError } = await admin
      .from("album_share_claims")
      .select(
        "id, share_id, recipient_user_id, imported_folder_id",
      )
      .eq("share_id", shareId)
      .eq("recipient_user_id", user.id)
      .eq("imported_folder_id", folderId)
      .maybeSingle();

    if (claimError) throw claimError;

    if (!claim) {
      return json({ error: "Claim not found" }, 404);
    }

    const { data: share, error: shareError } = await admin
      .from("album_shares")
      .select("id, folder_id, user_id")
      .eq("id", claim.share_id)
      .maybeSingle();

    if (shareError) throw shareError;

    if (!share) {
      return json({ error: "Share not found" }, 404);
    }

    const { data: sourceFolder, error: sourceFolderError } =
      await admin
        .from("memory_folders")
        .select("id, user_id, cover_photo")
        .eq("id", share.folder_id)
        .eq("user_id", share.user_id)
        .maybeSingle();

    if (sourceFolderError) throw sourceFolderError;

    if (!sourceFolder) {
      return json({ error: "Source folder not found" }, 404);
    }

    const { data: targetFolder, error: targetFolderError } =
      await admin
        .from("memory_folders")
        .select("id, user_id, cover_photo")
        .eq("id", claim.imported_folder_id)
        .eq("user_id", user.id)
        .maybeSingle();

    if (targetFolderError) throw targetFolderError;

    if (!targetFolder) {
      return json({ error: "Imported folder not found" }, 404);
    }

    const { data: mappings, error: mappingsError } = await admin
      .from("album_share_claim_memories")
      .select("source_memory_id, imported_memory_id")
      .eq("claim_id", claim.id);

    if (mappingsError) throw mappingsError;

    let copied = 0;
    let reused = 0;
    let skipped = 0;

    const sourceCoverPath = storagePath(sourceFolder.cover_photo);

    if (sourceCoverPath) {
      const expectedPrefix =
        `${share.user_id}/memory-folders/${sourceFolder.id}/`;

      if (!sourceCoverPath.startsWith(expectedPrefix)) {
        throw new Error("Invalid source folder cover path");
      }

      const destinationPath =
        `${user.id}/memory-folders/${targetFolder.id}/${filename(sourceCoverPath)}`;

      if (storagePath(targetFolder.cover_photo) !== destinationPath) {
        const result = await ensureCopied(
          admin,
          sourceCoverPath,
          destinationPath,
        );

        if (result === "copied") copied += 1;
        if (result === "existing") reused += 1;

        const { error: updateFolderError } = await admin
          .from("memory_folders")
          .update({
            cover_photo: storageRef(destinationPath),
          })
          .eq("id", targetFolder.id)
          .eq("user_id", user.id);

        if (updateFolderError) throw updateFolderError;
      } else {
        skipped += 1;
      }
    }

    const sourceMemoryIds = (mappings ?? []).map(
      (mapping) => mapping.source_memory_id,
    );

    const importedMemoryIds = (mappings ?? []).map(
      (mapping) => mapping.imported_memory_id,
    );

    const sourceMemories =
      sourceMemoryIds.length === 0
        ? []
        : (
            await admin
              .from("memories")
              .select("id, folder_id, user_id, photo")
              .in("id", sourceMemoryIds)
          ).data ?? [];

    const importedMemories =
      importedMemoryIds.length === 0
        ? []
        : (
            await admin
              .from("memories")
              .select("id, folder_id, user_id, photo")
              .in("id", importedMemoryIds)
          ).data ?? [];

    const sourceById = new Map(
      sourceMemories.map((memory) => [memory.id, memory]),
    );

    const importedById = new Map(
      importedMemories.map((memory) => [memory.id, memory]),
    );

    for (const mapping of mappings ?? []) {
      const sourceMemory = sourceById.get(
        mapping.source_memory_id,
      );

      const importedMemory = importedById.get(
        mapping.imported_memory_id,
      );

      if (!sourceMemory || !importedMemory) {
        throw new Error("Share memory mapping is incomplete");
      }

      if (
        sourceMemory.folder_id !== sourceFolder.id ||
        sourceMemory.user_id !== share.user_id
      ) {
        throw new Error("Invalid source memory mapping");
      }

      if (
        importedMemory.folder_id !== targetFolder.id ||
        importedMemory.user_id !== user.id
      ) {
        throw new Error("Invalid imported memory mapping");
      }

      const sourcePath = storagePath(sourceMemory.photo);

      if (!sourcePath) {
        skipped += 1;
        continue;
      }

      const expectedPrefix =
        `${share.user_id}/memories/${sourceMemory.id}/`;

      if (!sourcePath.startsWith(expectedPrefix)) {
        throw new Error("Invalid source memory photo path");
      }

      const destinationPath =
        `${user.id}/memories/${importedMemory.id}/${filename(sourcePath)}`;

      if (storagePath(importedMemory.photo) === destinationPath) {
        skipped += 1;
        continue;
      }

      const result = await ensureCopied(
        admin,
        sourcePath,
        destinationPath,
      );

      if (result === "copied") copied += 1;
      if (result === "existing") reused += 1;

      const { error: updateMemoryError } = await admin
        .from("memories")
        .update({
          photo: storageRef(destinationPath),
        })
        .eq("id", importedMemory.id)
        .eq("folder_id", targetFolder.id)
        .eq("user_id", user.id);

      if (updateMemoryError) throw updateMemoryError;
    }

    return json({
      ok: true,
      claimId: claim.id,
      folderId: targetFolder.id,
      mappedMemories: mappings?.length ?? 0,
      copied,
      reused,
      skipped,
    });
  } catch (error) {
    console.error("claim-share-media failed", error);

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Media copy failed",
      },
      500,
    );
  }
});
