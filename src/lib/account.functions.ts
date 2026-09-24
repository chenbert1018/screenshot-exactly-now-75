import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * 永久刪除目前登入者的帳號。
 * 安全性：身分完全來自已驗證的 bearer token（requireSupabaseAuth），
 * 不接受任何前端傳入的 user id，呼叫者只能刪除自己。
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 先刪除該使用者在私有 bucket 的所有照片
    const { data: files } = await supabaseAdmin.storage
      .from("idoldays-media")
      .list(userId, { limit: 1000 });
    if (files && files.length > 0) {
      await supabaseAdmin.storage
        .from("idoldays-media")
        .remove(files.map((f) => `${userId}/${f.name}`));
    }

    // 刪除 auth user；profiles / idols / events 等資料表以 FK cascade 一併清除
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.error("[deleteMyAccount] failed", error);
      throw new Error("刪除失敗，請稍後再試");
    }
    return { ok: true };
  });
