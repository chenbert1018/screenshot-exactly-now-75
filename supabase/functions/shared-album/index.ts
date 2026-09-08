import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const bucket = "idoldays-media";
const ttlSeconds = 60 * 10;

type SharedMemoryRow = {
  id: string;
  title: string;
  note: string;
  photo: string;
  date: string | null;
  created_at: string;
};

function storagePath(value: string | null | undefined) {
  return value?.startsWith("storage:") ? value.slice("storage:".length) : null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return new Response("Not found", { status: 404, headers: corsHeaders });

  try {
    const { token } = await request.json();
    if (typeof token !== "string" || !/^[a-f0-9]{48}$/.test(token)) {
      return new Response("Not found", { status: 404, headers: corsHeaders });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const { data: share, error: shareError } = await admin
      .from("album_shares")
      .select("folder_id, memory_folders!inner(title, cover_photo)")
      .eq("mode", "PUBLIC")
      .eq("public_token", token)
      .maybeSingle();
    if (shareError || !share) return new Response("Not found", { status: 404, headers: corsHeaders });

    const folder = share.memory_folders as unknown as {
      title: string; cover_photo: string;
    };
    const { data: memories, error: memoriesError } = await admin
      .from("memories")
      .select("id, title, note, photo, date, created_at")
      .eq("folder_id", share.folder_id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (memoriesError) throw memoriesError;

    const sign = async (value: string | null | undefined) => {
      const path = storagePath(value);
      if (!path) return value ?? "";
      const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, ttlSeconds);
      return error ? "" : (data?.signedUrl ?? "");
    };

    return Response.json({
      folder: {
        title: folder.title,
        coverPhoto: await sign(folder.cover_photo),
      },
      memories: await Promise.all((memories ?? []).map(async (memory: SharedMemoryRow) => ({
        id: memory.id,
        title: memory.title,
        note: memory.note,
        photo: await sign(memory.photo),
        date: memory.date,
      }))),
    }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("shared-album failed", error);
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }
});
