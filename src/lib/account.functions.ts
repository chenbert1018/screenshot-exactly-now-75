import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * 永久刪除目前登入者的帳號。
 * 身分只來自已驗證的 bearer token，不接受前端 user id。
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: files } = await supabaseAdmin.storage
      .from("idoldays-media")
      .list(userId, { limit: 1000 });

    if (files?.length) {
      const paths = files
        .filter((file) => file.name)
        .map((file) => `${userId}/${file.name}`);

      if (paths.length) {
        const { error: storageError } = await supabaseAdmin.storage
          .from("idoldays-media")
          .remove(paths);
        if (storageError) {
          console.warn("[deleteMyAccount] storage cleanup failed", storageError);
        }
      }
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.error("[deleteMyAccount] failed", error);
      throw new Error("刪除失敗，請稍後再試");
    }

    return { ok: true };
  });
