import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { UserRound, Settings, Bell, Palette, Sparkles, ChevronRight, Cloud, Pencil, Trash2 } from "lucide-react";
import {
  GeneralSettingsSheet,
  NotificationSettingsSheet,
  ThemeSettingsSheet,
} from "@/components/SettingsSheets";
import { AppShell, PageHeader, Section, SoftCard } from "@/components/AppShell";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDaysBefore } from "@/lib/reminders";
import { useReminderSource } from "@/lib/reminders.source";
import { useIdolSource } from "@/lib/idols.source";
import { eventTypeMeta } from "@/lib/events";
import { useEventSource } from "@/lib/events.source";
import { Paywall } from "@/components/Paywall";
import { PLUS_NAME, PLUS_PRICE_LABEL, useSubscription } from "@/lib/subscription";
import { fetchMyProfile, updateMyDisplayName, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "我的｜IdolDays" },
      { name: "description", content: "個人資料與 App 設定。" },
      { property: "og:title", content: "我的｜IdolDays" },
      { property: "og:description", content: "個人資料與 App 設定。" },
    ],
  }),
  component: ProfilePage,
});

type SettingKey = "general" | "notification" | "theme";
const LOCAL_NAME_KEY = "idoldays.profile.displayName";

const settings: { key: SettingKey; label: string; Icon: typeof Settings }[] = [
  { key: "general", label: "一般設定", Icon: Settings },
  { key: "notification", label: "提醒通知", Icon: Bell },
  { key: "theme", label: "外觀主題", Icon: Palette },
];

function ProfilePage() {
  const [openSheet, setOpenSheet] = useState<SettingKey | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { isPlus } = useSubscription();
  const { reminders, updateReminder, removeReminder } = useReminderSource();
  const { idols } = useIdolSource();
  const { events } = useEventSource();

  useEffect(() => {
    const localName = window.localStorage.getItem(LOCAL_NAME_KEY)?.trim() ?? "";
    setDisplayName(localName);
    setNameDraft(localName);
  }, []);

  useEffect(() => {
    let active = true;
    if (!user) return;
    fetchMyProfile(user.id)
      .then((profile) => {
        if (!active || !profile) return;
        const cloudName = profile.displayName?.trim() ?? "";
        if (cloudName) {
          setDisplayName(cloudName);
          setNameDraft(cloudName);
          window.localStorage.setItem(LOCAL_NAME_KEY, cloudName);
        }
      })
      .catch((error) => {
        if (active) setProfileError(error instanceof Error ? error.message : "個人資料讀取失敗");
      });
    return () => { active = false; };
  }, [user]);

  const saveName = async () => {
    const next = nameDraft.trim();
    if (!next) {
      setProfileError("請輸入名稱");
      return;
    }
    setSavingName(true);
    setProfileError(null);
    try {
      window.localStorage.setItem(LOCAL_NAME_KEY, next);
      if (user) await updateMyDisplayName(user.id, next);
      setDisplayName(next);
      setEditingName(false);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "名稱儲存失敗");
    } finally {
      setSavingName(false);
    }
  };

  const reminderRows = reminders.map((r) => {
    const event = r.eventId ? events.find((e) => e.id === r.eventId) : undefined;
    const idol = idols.find((i) => i.id === (r.idolId ?? event?.idolId));
    const title = r.type === "BIRTHDAY" ? "🎂 生日" : r.type === "ANNIVERSARY" ? "✨ 出道紀念日" : event ? `${eventTypeMeta(event.type).emoji} ${event.title}` : "已刪除的日子";
    return { id: r.id, title, idolName: idol?.name ?? "已刪除的偶像", daysBefore: r.daysBefore, enabled: r.enabled };
  });

  return (
    <AppShell>
      <PageHeader title="我的" />

      <SoftCard className="mb-8 px-5 py-6">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-surface text-muted-foreground">
            <UserRound className="size-7" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  autoFocus
                  aria-label="顯示名稱"
                  maxLength={30}
                  value={nameDraft}
                  placeholder="輸入你的名稱"
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void saveName(); }}
                />
                <Button type="button" size="sm" disabled={savingName} onClick={() => void saveName()}>
                  {savingName ? "儲存中" : "儲存"}
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="flex max-w-full items-center gap-2 text-left"
                onClick={() => { setNameDraft(displayName); setEditingName(true); }}
              >
                <span className="truncate text-[17px] font-medium">{displayName || "尚未設定名稱"}</span>
                <Pencil className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.6} />
              </button>
            )}
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {authLoading ? "正在確認帳號…" : user ? user.email ?? "已登入 IdolDays" : "歡迎來到 IdolDays"}
            </p>
          </div>
        </div>
        {profileError ? <p className="mt-3 text-sm text-destructive">{profileError}</p> : null}
      </SoftCard>

      <Section title="雲端帳號">
        <SoftCard className="divide-y divide-border/60">
          <Link to="/auth" className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors active:bg-surface/70">
            <Cloud className="size-[18px] text-muted-foreground" strokeWidth={1.6} />
            <div className="min-w-0 flex-1">
              <p className="text-sm">{authLoading ? "確認登入狀態…" : user ? "已登入雲端帳號" : "登入／註冊雲端帳號"}</p>
              {user?.email ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p> : null}
            </div>
            <ChevronRight className="size-4 text-muted-foreground" strokeWidth={1.6} />
          </Link>
        </SoftCard>
      </Section>

      <Section title="提醒設定">
        <SoftCard className="px-5 py-5">
          <p className="flex items-center gap-2 text-[15px] font-medium">🔔 重要日子提醒</p>
          <p className="mt-1 text-sm text-muted-foreground">已開啟的提醒會同步到 App，並在 iPhone 排程通知。</p>
          {reminderRows.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-surface/60 px-4 py-4 text-sm text-muted-foreground">還沒有提醒。到日子或偶像頁面就能設定。</p>
          ) : (
            <ul className="mt-4 divide-y divide-border/60">
              {reminderRows.map((row) => (
                <li key={row.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{row.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.idolName} · {formatDaysBefore(row.daysBefore)}</p>
                  </div>
                  <Switch checked={row.enabled} aria-label={`${row.title} 提醒開關`} onCheckedChange={(v) => void updateReminder(row.id, { enabled: v })} />
                  <button type="button" aria-label={`刪除 ${row.title} 提醒`} onClick={() => void removeReminder(row.id)} className="rounded-full p-2 text-muted-foreground transition-transform duration-300 active:scale-90">
                    <Trash2 className="size-4" strokeWidth={1.6} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SoftCard>
      </Section>

      <Section title="設定">
        <SoftCard className="divide-y divide-border/60">
          {settings.map(({ key, label, Icon }) => (
            <button key={key} type="button" onClick={() => setOpenSheet(key)} className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors active:bg-surface/70">
              <Icon className="size-[18px] text-muted-foreground" strokeWidth={1.6} />
              <span className="flex-1 text-sm">{label}</span>
              <ChevronRight className="size-4 text-muted-foreground" strokeWidth={1.6} />
            </button>
          ))}
        </SoftCard>
      </Section>

      <Section title="訂閱">
        <SoftCard className="px-0 py-0">
          <button type="button" onClick={() => setPaywall(true)} className="flex w-full items-center gap-4 px-5 py-5 text-left transition-colors active:bg-surface/70">
            <div className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground"><Sparkles className="size-5" strokeWidth={1.6} /></div>
            <div className="flex-1">
              <p className="flex items-center gap-2 text-[15px] font-medium">{PLUS_NAME}{isPlus ? <span className="rounded-full bg-accent px-2 py-0.5 text-[13px] text-accent-foreground">訂閱中</span> : null}</p>
              <p className="mt-1 text-sm text-muted-foreground">{PLUS_PRICE_LABEL}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" strokeWidth={1.6} />
          </button>
        </SoftCard>
      </Section>

      <Paywall open={paywall} onOpenChange={setPaywall} />
      <p className="mt-10 text-center text-xs text-muted-foreground">版本 0.1.0（S0 Foundation）</p>
      <GeneralSettingsSheet open={openSheet === "general"} onOpenChange={(v) => setOpenSheet(v ? "general" : null)} />
      <NotificationSettingsSheet open={openSheet === "notification"} onOpenChange={(v) => setOpenSheet(v ? "notification" : null)} />
      <ThemeSettingsSheet open={openSheet === "theme"} onOpenChange={(v) => setOpenSheet(v ? "theme" : null)} />
    </AppShell>
  );
}
