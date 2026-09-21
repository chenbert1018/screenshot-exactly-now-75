import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { UserRound, Settings, Bell, Palette, Sparkles, ChevronRight, Cloud, PanelsTopLeft } from "lucide-react";
import {
  GeneralSettingsSheet,
  NotificationSettingsSheet,
  ThemeSettingsSheet,
} from "@/components/SettingsSheets";
import { AppShell, PageHeader, Section, SoftCard } from "@/components/AppShell";
import { Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { formatDaysBefore } from "@/lib/reminders";
import { useReminderSource } from "@/lib/reminders.source";
import { useIdolSource } from "@/lib/idols.source";
import { eventTypeMeta } from "@/lib/events";
import { useEventSource } from "@/lib/events.source";
import { Paywall } from "@/components/Paywall";
import { PLUS_NAME, PLUS_PRICE_LABEL, useSubscription } from "@/lib/subscription";
import { fetchMyProfile, type CloudProfile, useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

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

const settings: { key: SettingKey; label: string; Icon: typeof Settings }[] = [
  { key: "general", label: "一般設定", Icon: Settings },
  { key: "notification", label: "提醒通知", Icon: Bell },
  { key: "theme", label: "外觀主題", Icon: Palette },
];

function ProfilePage() {
  const [openSheet, setOpenSheet] = useState<SettingKey | null>(null);
  const [paywall, setPaywall] = useState(false);
  const { isPlus } = useSubscription();
  const { reminders, updateReminder, removeReminder } = useReminderSource();
  const { idols } = useIdolSource();
  const { events } = useEventSource();
  const { user, loading: authLoading } = useAuth();
  const [cloudProfile, setCloudProfile] = useState<CloudProfile | null>(null);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setCloudProfile(null);
      return () => { active = false; };
    }

    void fetchMyProfile(user.id)
      .then((profile) => {
        if (active) setCloudProfile(profile);
      })
      .catch(() => {
        // A profile lookup failure must not make an authenticated user look signed out.
        if (active) setCloudProfile(null);
      });

    return () => { active = false; };
  }, [user?.id]);

  const displayName =
    cloudProfile?.displayName.trim() ||
    user?.user_metadata?.["display_name"] ||
    "尚未設定名稱";

  async function editDisplayName() {
    if (!user?.id) return;
    const next = window.prompt("顯示名稱", cloudProfile?.displayName || "");
    if (next === null) return;

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: next.trim() })
      .eq("user_id", user.id);

    if (!error) {
      const refreshed = await fetchMyProfile(user.id).catch(() => null);
      if (refreshed) setCloudProfile(refreshed);
    }
  }

  const reminderRows = reminders.map((r) => {
    const event = r.eventId ? events.find((e) => e.id === r.eventId) : undefined;
    const idol = idols.find((i) => i.id === (r.idolId ?? event?.idolId));
    const title =
      r.type === "BIRTHDAY"
        ? "🎂 生日"
        : r.type === "ANNIVERSARY"
          ? "✨ 出道紀念日"
          : event
            ? `${eventTypeMeta(event.type).emoji} ${event.title}`
            : "已刪除的日子";
    return {
      id: r.id,
      title,
      idolName: idol?.name ?? "已刪除的偶像",
      daysBefore: r.daysBefore,
      enabled: r.enabled,
    };
  });

  return (
    <AppShell>
      <PageHeader title="我的" subtitle="只屬於你的 IdolDays ♡" />

      <SoftCard className="relative mb-8 overflow-hidden px-5 py-6">
        <span
          aria-hidden
          className="pointer-events-none absolute top-4 right-5 text-lg text-primary/25"
        >
          ✦
        </span>

        <p className="mb-4 text-xs font-semibold tracking-[0.16em] text-primary">
          MY IDOLDAYS ♡
        </p>

        <div className="flex items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-accent/35 text-primary">
          <UserRound className="size-7" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-medium">
            {authLoading ? "讀取帳號中…" : displayName}
          </p>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {user?.email ?? "歡迎來到 IdolDays"}
          </p>
        </div>
        {user && !authLoading ? (
          <button
            type="button"
            onClick={() => void editDisplayName()}
            className="rounded-full border border-border/60 bg-card/70 min-h-11 px-4 py-2.5 text-sm text-muted-foreground transition-all duration-300 active:scale-95"
          >
            設定名稱
          </button>
        ) : null}
        </div>
      </SoftCard>

      <Section title="我的帳號">
        <SoftCard className="divide-y divide-border/60">
          <Link
            to="/auth"
            className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors active:bg-surface/70"
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-accent/30 text-primary">
              <Cloud className="size-[17px]" strokeWidth={1.5} />
            </div>
            <span className="min-w-0 flex-1">
              <span className="block text-base">
                {authLoading ? "讀取帳號中…" : user ? "已登入雲端帳號" : "登入／註冊雲端帳號"}
              </span>
              {user?.email ? (
                <span className="mt-0.5 block truncate text-sm text-muted-foreground">{user.email}</span>
              ) : null}
            </span>
            <ChevronRight className="size-4 text-muted-foreground" strokeWidth={1.6} />
          </Link>
        </SoftCard>
      </Section>


      <Section title="替我記住的日子">
        <SoftCard className="px-5 py-5">
          <p className="flex items-center gap-2 font-display text-[16px] font-medium">
            重要日子提醒
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            到了重要的日子，IdolDays 會記得提醒你。
          </p>
          {reminderRows.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-surface/60 px-4 py-4 text-sm text-muted-foreground">
              還沒有提醒。到日子或偶像頁面就能設定。
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border/60">
              {reminderRows.map((row) => (
                <li key={row.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base">{row.title}</p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {row.idolName} · {formatDaysBefore(row.daysBefore)}
                    </p>
                  </div>
                  <Switch
                    checked={row.enabled}
                    aria-label={`${row.title} 提醒開關`}
                    onCheckedChange={(v) => void updateReminder(row.id, { enabled: v })}
                  />
                  <button
                    type="button"
                    aria-label={`刪除 ${row.title} 提醒`}
                    onClick={() => void removeReminder(row.id)}
                    className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-transform duration-300 active:scale-90"
                  >
                    <Trash2 className="size-4" strokeWidth={1.6} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SoftCard>
      </Section>

      <Section title="IdolDays 設定">
        <SoftCard className="divide-y divide-border/60">
          {settings.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setOpenSheet(key)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors active:bg-surface/70"
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-surface text-primary">
                <Icon className="size-[17px]" strokeWidth={1.5} />
              </div>
              <span className="flex-1 text-base">{label}</span>
              <ChevronRight className="size-4 text-muted-foreground" strokeWidth={1.6} />
            </button>
          ))}

          <Link
            to="/widget"
            className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors active:bg-surface/70"
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-surface text-primary">
              <PanelsTopLeft className="size-[17px]" strokeWidth={1.5} />
            </div>
            <span className="flex-1 text-base">桌面陪伴</span>
            <ChevronRight className="size-4 text-muted-foreground" strokeWidth={1.6} />
          </Link>
        </SoftCard>
      </Section>

      <Section title="IdolDays Plus ♡">
        <SoftCard className="overflow-hidden px-0 py-0">
          <button
            type="button"
            onClick={() => setPaywall(true)}
            className="flex w-full items-center gap-4 px-5 py-5 text-left transition-colors active:bg-surface/70"
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-accent/40 text-primary">
              <Sparkles className="size-5" strokeWidth={1.6} />
            </div>
            <div className="flex-1">
              <p className="flex items-center gap-2 text-[15px] font-medium">
                {PLUS_NAME}
                {isPlus ? (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[13px] text-accent-foreground">
                    訂閱中
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{PLUS_PRICE_LABEL}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" strokeWidth={1.6} />
          </button>
        </SoftCard>
      </Section>

      <Paywall open={paywall} onOpenChange={setPaywall} />

      <div className="mt-10 text-center">
        <p className="font-display text-[16px] text-primary">IdolDays ♡</p>
        <p className="mt-1 text-xs text-muted-foreground">版本 0.1.0</p>
      </div>

      <GeneralSettingsSheet
        open={openSheet === "general"}
        onOpenChange={(v) => setOpenSheet(v ? "general" : null)}
      />
      <NotificationSettingsSheet
        open={openSheet === "notification"}
        onOpenChange={(v) => setOpenSheet(v ? "notification" : null)}
      />
      <ThemeSettingsSheet
        open={openSheet === "theme"}
        onOpenChange={(v) => setOpenSheet(v ? "theme" : null)}
      />
    </AppShell>
  );
}
