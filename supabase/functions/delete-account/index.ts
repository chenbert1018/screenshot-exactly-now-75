import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const bucket = "idoldays-media";

async function removeStorageTree(
  admin: ReturnType<typeof createClient>,
  prefix: string,
): Promise<void> {
  const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw error;

  const files = (data ?? []).filter((entry) => entry.id).map((entry) => `${prefix}/${entry.name}`);
  if (files.length > 0) {
    const { error: removeError } = await admin.storage.from(bucket).remove(files);
    if (removeError) throw removeError;
  }

  for (const folder of (data ?? []).filter((entry) => !entry.id)) {
    await removeStorageTree(admin, `${prefix}/${folder.name}`);
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return new Response("Not found", { status: 404, headers: corsHeaders });

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const token = authHeader.slice("Bearer ".length);
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    // All database rows are user-owned through foreign-key cascades. Storage needs an
    // explicit removal because objects are not database rows.
    await removeStorageTree(admin, authData.user.id);

    const { error: deleteError } = await admin.auth.admin.deleteUser(authData.user.id);
    if (deleteError) throw deleteError;

    return Response.json({ ok: true }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("delete-account failed", error);
    return Response.json(
      { error: "Unable to delete account" },
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
