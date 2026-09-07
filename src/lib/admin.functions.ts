import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Admin Console 專用的 server functions。
 *
 * 安全原則：
 * - 一律先經過 requireSupabaseAuth（驗證 bearer token，取得可信的 userId）
 * - 再於 server 端用 service role 查 public.user_roles 確認 admin 身分
 * - 從不相信 client 傳入的 user_id
 * - 既有資料表的 RLS 完全沒有改動
 */

type Counts = Record<string, number>;

async function getAdminClient(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error("Unauthorized");
  if (!data) throw new Error("Unauthorized: admin only");
  return supabaseAdmin;
}

function countBy(rows: { user_id: string }[] | null): Counts {
  const out: Counts = {};
  for (const r of rows ?? []) out[r.user_id] = (out[r.user_id] ?? 0) + 1;
  return out;
}

/* ------------------------------ role check ------------------------------ */

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: Boolean(data) };
  });

/* ------------------------------- dashboard ------------------------------ */

export const adminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await getAdminClient(context.userId);

    const head = async (table: string, filter?: (q: any) => any) => {
      let q = db.from(table as never).select("*", { count: "exact", head: true });
      if (filter) q = filter(q);
      const { count, error } = await q;
      return error ? null : (count ?? 0);
    };

    const users = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });

    return {
      users: users.error ? null : users.data.users.length,
      idols: await head("idols"),
      events: await head("events"),
      memories: await head("memories"),
      memoryFolders: await head("memory_folders"),
      sugar: await head("sugar_items"),
      remindersEnabled: await head("reminders", (q) => q.eq("enabled", true)),
      widgetUsers: await head("widget_preferences"),
    };
  });

/* --------------------------------- users -------------------------------- */

export const adminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await getAdminClient(context.userId);

    const list = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (list.error) throw new Error(list.error.message);

    const [idols, events, memories, sugar, reminders] = await Promise.all([
      db.from("idols").select("user_id"),
      db.from("events").select("user_id"),
      db.from("memories").select("user_id"),
      db.from("sugar_items").select("user_id"),
      db.from("reminders").select("user_id"),
    ]);

    const ci = countBy(idols.data);
    const ce = countBy(events.data);
    const cm = countBy(memories.data);
    const cs = countBy(sugar.data);
    const cr = countBy(reminders.data);

    return list.data.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      confirmed: Boolean(u.email_confirmed_at),
      idols: ci[u.id] ?? 0,
      events: ce[u.id] ?? 0,
      memories: cm[u.id] ?? 0,
      sugar: cs[u.id] ?? 0,
      reminders: cr[u.id] ?? 0,
    }));
  });

/* --------------------------------- idols -------------------------------- */

export const adminIdols = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await getAdminClient(context.userId);

    const [rows, profiles, users] = await Promise.all([
      db.from("idols").select("*").order("created_at", { ascending: false }).limit(500),
      db.from("profiles").select("user_id, main_idol_id"),
      db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    if (rows.error) throw new Error(rows.error.message);

    const mainByUser = new Map((profiles.data ?? []).map((p) => [p.user_id, p.main_idol_id]));
    const emailById = new Map((users.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));

    return (rows.data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      group: r.group_name,
      birthday: r.birthday,
      debutDate: r.debut_date,
      fanName: r.fan_name,
      fanColor: r.favorite_color,
      sinceDate: r.since_date,
      hasPhoto: Boolean(r.photo),
      isMain: mainByUser.get(r.user_id) === r.id,
      userId: r.user_id,
      userEmail: emailById.get(r.user_id) ?? "",
      createdAt: r.created_at,
    }));
  });

/* --------------------------------- events ------------------------------- */

export const adminEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await getAdminClient(context.userId);

    const [rows, idols, milestones, users] = await Promise.all([
      db.from("events").select("*").order("date", { ascending: false }).limit(500),
      db.from("idols").select("id, name"),
      db.from("milestones").select("event_id"),
      db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    if (rows.error) throw new Error(rows.error.message);

    const idolName = new Map((idols.data ?? []).map((i) => [i.id, i.name]));
    const emailById = new Map((users.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));
    const msCount: Counts = {};
    for (const m of milestones.data ?? []) {
      if (m.event_id) msCount[m.event_id] = (msCount[m.event_id] ?? 0) + 1;
    }

    return (rows.data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      date: r.date,
      note: r.note,
      idolName: r.idol_id ? (idolName.get(r.idol_id) ?? "已刪除的偶像") : "—",
      userEmail: emailById.get(r.user_id) ?? "",
      milestones: msCount[r.id] ?? 0,
      createdAt: r.created_at,
    }));
  });

/* -------------------------------- memories ------------------------------ */

export const adminMemories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await getAdminClient(context.userId);

    const [rows, folders, idols, users] = await Promise.all([
      db.from("memories").select("*").order("date", { ascending: false }).limit(500),
      db.from("memory_folders").select("id, title"),
      db.from("idols").select("id, name"),
      db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    if (rows.error) throw new Error(rows.error.message);

    const folderName = new Map((folders.data ?? []).map((f) => [f.id, f.title]));
    const idolName = new Map((idols.data ?? []).map((i) => [i.id, i.name]));
    const emailById = new Map((users.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));

    return (rows.data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      note: r.note,
      date: r.date,
      folder: r.folder_id ? (folderName.get(r.folder_id) ?? "已刪除的資料夾") : "—",
      idolName: r.idol_id ? (idolName.get(r.idol_id) ?? "已刪除的偶像") : "—",
      userEmail: emailById.get(r.user_id) ?? "",
      hasPhoto: Boolean(r.photo),
      createdAt: r.created_at,
    }));
  });

/* --------------------------------- sugar -------------------------------- */

export const adminSugar = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await getAdminClient(context.userId);

    const [rows, idols, users] = await Promise.all([
      db.from("sugar_items").select("*").order("date", { ascending: false }).limit(500),
      db.from("idols").select("id, name"),
      db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    if (rows.error) throw new Error(rows.error.message);

    const idolName = new Map((idols.data ?? []).map((i) => [i.id, i.name]));
    const emailById = new Map((users.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));

    return (rows.data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      date: r.date,
      note: r.note,
      link: r.link,
      idolName: r.idol_id ? (idolName.get(r.idol_id) ?? "已刪除的偶像") : "—",
      userEmail: emailById.get(r.user_id) ?? "",
      hasImage: Boolean(r.image),
      createdAt: r.created_at,
    }));
  });

/* ------------------------------- reminders ------------------------------ */

export const adminReminders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await getAdminClient(context.userId);

    const [rows, idols, events, users] = await Promise.all([
      db.from("reminders").select("*").order("created_at", { ascending: false }).limit(500),
      db.from("idols").select("id, name"),
      db.from("events").select("id, title"),
      db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    if (rows.error) throw new Error(rows.error.message);

    const idolName = new Map((idols.data ?? []).map((i) => [i.id, i.name]));
    const eventTitle = new Map((events.data ?? []).map((e) => [e.id, e.title]));
    const emailById = new Map((users.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));

    return (rows.data ?? []).map((r) => ({
      id: r.id,
      type: r.type,
      daysBefore: r.days_before,
      enabled: r.enabled,
      target: r.event_id
        ? (eventTitle.get(r.event_id) ?? "已刪除的日子")
        : r.idol_id
          ? (idolName.get(r.idol_id) ?? "已刪除的偶像")
          : "—",
      userEmail: emailById.get(r.user_id) ?? "",
      createdAt: r.created_at,
    }));
  });

/* -------------------------------- widget -------------------------------- */

export const adminWidget = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await getAdminClient(context.userId);

    const [rows, idols, users] = await Promise.all([
      db.from("widget_preferences").select("*"),
      db.from("idols").select("id, name"),
      db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    if (rows.error) throw new Error(rows.error.message);

    const idolName = new Map((idols.data ?? []).map((i) => [i.id, i.name]));
    const emailById = new Map((users.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));

    const contentCounts: Counts = {};
    let withIdol = 0;
    for (const r of rows.data ?? []) {
      for (const c of r.enabled_contents ?? []) contentCounts[c] = (contentCounts[c] ?? 0) + 1;
      if (r.idol_id) withIdol += 1;
    }

    return {
      total: (rows.data ?? []).length,
      withMainIdol: withIdol,
      contentCounts,
      rows: (rows.data ?? []).map((r) => ({
        userId: r.user_id,
        userEmail: emailById.get(r.user_id) ?? "",
        idolName: r.idol_id ? (idolName.get(r.idol_id) ?? "已刪除的偶像") : "—",
        enabledContents: r.enabled_contents ?? [],
        updatedAt: r.updated_at,
      })),
    };
  });
