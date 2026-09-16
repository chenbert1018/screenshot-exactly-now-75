import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, ChevronRight, Cloud, LogOut, Palette, PanelsTopLeft, Pencil, Settings, Sparkles, Trash2, UserRound } from "lucide-react";
import { GeneralSettingsSheet, NotificationSettingsSheet, ThemeSettingsSheet } from "@/components/SettingsSheets";
import { AppShell, PageHeader, Section, SoftCard } from "@/components/AppShell";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatDaysBefore } from "@/lib/reminders";
import { useReminderSource } from "@/lib/reminders.source";
import { useIdolSource } from "@/lib/idols.source";
import { eventTypeMeta } from "@/lib/events";
import { useEventSource } from "@/lib/events.source";
import { scheduleEventNotifications } from "@/lib/event-notifications";
import { clearIdolDaysDeviceCache, deleteMyAccount, fetchMyProfile, updateMyProfile, useAuth, useAuthActions, type CloudProfile } from "@/lib/auth";
import { PLUS_NAME, SUBSCRIPTIONS_AVAILABLE, useSubscription } from "@/lib/subscription";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "我的｜IdolDays" }, { name: "description", content: "個人資料與 App 設定。" }] }),
  component: ProfilePage,
});

type SettingKey = "general" | "notification" | "theme";
const settings: { key: SettingKey; label: string; Icon: typeof Settings }[] = [
  { key: "general", label: "一般設定", Icon: Settings },
  { key: "notification", label: "提醒通知", Icon: Bell },
  { key: "theme", label: "外觀主題", Icon: Palette },
];

function ProfilePage() {
  const [openSheet, setOpenSheet] = useState<SettingKey | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { signOut } = useAuthActions();
  const [profile, setProfile] = useState<CloudProfile | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const { isPlus } = useSubscription();
  const { reminders, updateReminder, removeReminder } = useReminderSource();
  const { idols } = useIdolSource();
  const { events } = useEventSource();

  useEffect(() => {
    let active = true;
    if (!user) { setProfile(null); setEditingName(false); return; }
    void fetchMyProfile(user.id).then((next) => {
      if (!active) return;
      setProfile(next);
      setNameDraft(next?.displayName ?? "");
    }).catch(() => active && setAccountMessage("暫時無法讀取雲端個人資料，請稍後再試。"));
    return () => { active = false; };
  }, [user?.id]);

  const displayName = profile?.displayName.trim() || user?.email?.split("@")[0] || "追星中的你";

  async function saveName() {
    if (!user || accountBusy) return;
    const nextName = nameDraft.trim();
    if (nextName.length > 40) { setAccountMessage("名稱請控制在 40 個字以內。"); return; }
    setAccountBusy(true); setAccountMessage(null);
    try {
      const next = await updateMyProfile(user.id, { displayName: nextName });
      setProfile(next); setEditingName(false);
    } catch { setAccountMessage("名稱未儲存，請稍後再試。"); }
    finally { setAccountBusy(false); }
  }

  async function handleSignOut(clearDevice: boolean) {
    setAccountBusy(true); setAccountMessage(null);
    const error = await signOut();
    if (!error && clearDevice) clearIdolDaysDeviceCache();
    setAccountBusy(false); setSignOutOpen(false);
    setAccountMessage(error ? "登出失敗，請稍後再試。" : clearDevice ? "已登出並清除此裝置的 IdolDays 資料。" : "已登出；此裝置的本機資料仍保留。");
  }

  async function handleDeleteAccount() {
    if (deleteText !== "刪除" || accountBusy) return;
    setAccountBusy(true); setAccountMessage(null);
    try {
      await deleteMyAccount();
      clearIdolDaysDeviceCache();
      window.location.assign("/");
    } catch {
      setAccountMessage("帳號尚未刪除。請確認 App 的 delete-account 雲端功能已部署後再試。");
      setAccountBusy(false);
    }
  }

  const reminderRows = reminders.map((r) => {
    const event = r.eventId ? events.find((e) => e.id === r.eventId) : undefined;
    const idol = idols.find((i) => i.id === (r.idolId ?? event?.idolId));
    const title = r.type === "BIRTHDAY" ? "🎂 生日" : r.type === "ANNIVERSARY" ? "✨ 出道紀念日" : event ? `${eventTypeMeta(event.type).emoji} ${event.title}` : "已刪除的日子";
    return { id: r.id, title, idolName: idol?.name ?? "已刪除的偶像", daysBefore: r.daysBefore, enabled: r.enabled, event };
  });

  async function setReminderEnabled(
    row: (typeof reminderRows)[number],
    enabled: boolean,
  ) {
    await updateReminder(row.id, { enabled });
    if (row.event) {
      await scheduleEventNotifications(row.event, enabled ? row.daysBefore : null);
    }
  }

  async function deleteReminder(row: (typeof reminderRows)[number]) {
    await removeReminder(row.id);
    if (row.event) {
      await scheduleEventNotifications(row.event, null);
    }
  }

  return <AppShell>
    <PageHeader title="我的" />
    <SoftCard className="mb-5 flex items-center gap-4 px-5 py-6">
      <div className="flex size-16 items-center justify-center rounded-full bg-surface text-muted-foreground"><UserRound className="size-7" strokeWidth={1.5} /></div>
      <div className="min-w-0 flex-1"><p className="truncate text-[17px] font-medium">{authLoading ? "讀取帳號中…" : user ? displayName : "尚未登入雲端"}</p><p className="mt-1 truncate text-sm text-muted-foreground">{user?.email ?? "登入後可同步資料與設定"}</p></div>
      {user ? <button type="button" aria-label="編輯名稱" onClick={() => setEditingName(true)} className="rounded-full p-2 text-muted-foreground active:bg-surface"><Pencil className="size-4" /></button> : null}
    </SoftCard>
    {editingName ? <SoftCard className="mb-5 px-5 py-4"><label className="text-sm font-medium" htmlFor="profile-name">顯示名稱</label><Input id="profile-name" value={nameDraft} maxLength={40} onChange={(event) => setNameDraft(event.target.value)} className="mt-2" placeholder="例如：Katy" /><div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => { setNameDraft(profile?.displayName ?? ""); setEditingName(false); }} className="rounded-full px-4 py-2 text-sm text-muted-foreground">取消</button><button type="button" disabled={accountBusy} onClick={() => void saveName()} className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60">{accountBusy ? "儲存中…" : "儲存"}</button></div></SoftCard> : null}
    {accountMessage ? <p className="mb-5 rounded-2xl bg-surface px-4 py-3 text-sm text-muted-foreground">{accountMessage}</p> : null}

    <Section title="雲端帳號"><SoftCard className="divide-y divide-border/60"><Link to="/auth" className="flex w-full items-center gap-3 px-5 py-4 text-left active:bg-surface/70"><Cloud className="size-[18px] text-muted-foreground" /><span className="flex-1 text-sm">{user ? "已登入雲端帳號" : "登入／註冊雲端帳號"}</span><ChevronRight className="size-4 text-muted-foreground" /></Link>{user ? <button type="button" onClick={() => setSignOutOpen(true)} className="flex w-full items-center gap-3 px-5 py-4 text-left active:bg-surface/70"><LogOut className="size-[18px] text-muted-foreground" /><span className="flex-1 text-sm">登出此帳號</span><ChevronRight className="size-4 text-muted-foreground" /></button> : null}</SoftCard></Section>
    <Section title="提醒設定"><SoftCard className="px-5 py-5"><p className="flex items-center gap-2 text-[15px] font-medium">🔔 重要日子提醒</p><p className="mt-1 text-sm text-muted-foreground">活動倒數提醒會同步到 App 並在 iPhone 排程；其他提醒會安全保留在帳號設定中。</p>{reminderRows.length === 0 ? <p className="mt-4 rounded-2xl bg-surface/60 px-4 py-4 text-sm text-muted-foreground">還沒有提醒。到日子或偶像頁面就能設定。</p> : <ul className="mt-4 divide-y divide-border/60">{reminderRows.map((row) => <li key={row.id} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm">{row.title}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{row.idolName} · {formatDaysBefore(row.daysBefore)}</p></div><Switch checked={row.enabled} aria-label={`${row.title} 提醒開關`} onCheckedChange={(v) => void setReminderEnabled(row, v)} /><button type="button" aria-label={`刪除 ${row.title} 提醒`} onClick={() => void deleteReminder(row)} className="rounded-full p-2 text-muted-foreground"><Trash2 className="size-4" /></button></li>)}</ul>}</SoftCard></Section>
    <Section title="設定"><SoftCard className="divide-y divide-border/60">{settings.map(({ key, label, Icon }) => <button key={key} type="button" onClick={() => setOpenSheet(key)} className="flex w-full items-center gap-3 px-5 py-4 text-left active:bg-surface/70"><Icon className="size-[18px] text-muted-foreground" /><span className="flex-1 text-sm">{label}</span><ChevronRight className="size-4 text-muted-foreground" /></button>)}<Link to="/widget" className="flex w-full items-center gap-3 px-5 py-4 text-left active:bg-surface/70"><PanelsTopLeft className="size-[18px] text-muted-foreground" /><span className="flex-1 text-sm">桌面陪伴</span><ChevronRight className="size-4 text-muted-foreground" /></Link></SoftCard></Section>
    <Section title="訂閱"><SoftCard className="flex items-center gap-4 px-5 py-5"><div className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground"><Sparkles className="size-5" /></div><div className="flex-1"><p className="text-[15px] font-medium">{PLUS_NAME}{isPlus ? " · 訂閱中" : ""}</p><p className="mt-1 text-sm text-muted-foreground">{SUBSCRIPTIONS_AVAILABLE ? "訂閱服務已開放" : "即將推出"}</p></div></SoftCard></Section>
    {user ? <Section title="帳號安全"><SoftCard className="px-5 py-5"><p className="text-sm text-muted-foreground">刪除帳號會永久移除雲端資料與相片，無法復原。</p><button type="button" onClick={() => { setDeleteText(""); setDeleteOpen(true); }} className="mt-4 flex items-center gap-2 rounded-full px-3 py-2 text-sm text-destructive active:bg-destructive/10"><Trash2 className="size-4" />刪除帳號</button></SoftCard></Section> : null}
    <p className="mt-10 text-center text-xs text-muted-foreground">版本 0.1.0（S0 Foundation）</p>
    <GeneralSettingsSheet open={openSheet === "general"} onOpenChange={(v) => setOpenSheet(v ? "general" : null)} /><NotificationSettingsSheet open={openSheet === "notification"} onOpenChange={(v) => setOpenSheet(v ? "notification" : null)} /><ThemeSettingsSheet open={openSheet === "theme"} onOpenChange={(v) => setOpenSheet(v ? "theme" : null)} />
    <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}><AlertDialogContent className="max-w-[22rem] rounded-3xl"><AlertDialogHeader><AlertDialogTitle>要登出嗎？</AlertDialogTitle><AlertDialogDescription>只登出會保留這台裝置上的本機資料。若共用裝置，請選擇清除本機資料。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="gap-2 sm:flex-col"><AlertDialogCancel className="rounded-full">取消</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); void handleSignOut(false); }} disabled={accountBusy} className="rounded-full">只登出</AlertDialogAction><button type="button" disabled={accountBusy} onClick={() => void handleSignOut(true)} className="rounded-full border border-destructive/30 px-4 py-2 text-sm text-destructive disabled:opacity-60">登出並清除本機資料</button></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialogContent className="max-w-[22rem] rounded-3xl"><AlertDialogHeader><AlertDialogTitle>永久刪除帳號？</AlertDialogTitle><AlertDialogDescription>這會刪除你的雲端偶像、日子、回憶、考古與上傳相片。請輸入「刪除」確認。</AlertDialogDescription></AlertDialogHeader><Input value={deleteText} onChange={(event) => setDeleteText(event.target.value)} placeholder="刪除" /><AlertDialogFooter><AlertDialogCancel className="rounded-full">取消</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); void handleDeleteAccount(); }} disabled={deleteText !== "刪除" || accountBusy} className="rounded-full bg-destructive text-destructive-foreground">{accountBusy ? "刪除中…" : "永久刪除"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </AppShell>;
}
