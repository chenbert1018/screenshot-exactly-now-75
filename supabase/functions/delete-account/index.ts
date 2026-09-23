import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }

  try {
    const authorization = request.headers.get("Authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders },
      );
    }

    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
      "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } =
      await userClient.auth.getUser();

    if (userError || !userData.user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders },
      );
    }

    const userId = userData.user.id;
    const admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // User media lives under {user_id}/..., so remove it before deleting auth.
    const bucket = "idoldays-media";
    const { data: folders } = await admin.storage.from(bucket).list(userId, {
      limit: 1000,
    });

    for (const folder of folders ?? []) {
      const { data: files } = await admin.storage
        .from(bucket)
        .list(`${userId}/${folder.name}`, { limit: 1000 });

      const paths = (files ?? [])
        .filter((item) => item.name)
        .map((item) => `${userId}/${folder.name}/${item.name}`);

      if (paths.length) {
        await admin.storage.from(bucket).remove(paths);
      }
    }

    const { error: deleteError } =
      await admin.auth.admin.deleteUser(userId);

    if (deleteError) throw deleteError;

    return Response.json(
      { success: true },
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("delete-account failed", error);
    return Response.json(
      { error: "Account deletion failed" },
      { status: 500, headers: corsHeaders },
    );
  }
});
