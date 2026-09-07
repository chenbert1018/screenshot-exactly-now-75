import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { UserRound, Settings, Bell, Palette, Sparkles, ChevronRight, Cloud } from "lucide-react";
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
  const { reminders, updateReminder, removeReminder } = useReminderSource();
  const { idols } = useIdolSource();
  const { events } = useEventSource();

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
      <PageHeader title="我的" />

      <SoftCard className="mb-8 flex items-center gap-4 px-5 py-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-surface text-muted-foreground">
          <UserRound className="size-7" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[17px] font-medium">尚未設定名稱</p>
          <p className="mt-1 text-sm text-muted-foreground">歡迎來到 IdolDays</p>
        </div>
      </SoftCard>

      <Section title="雲端帳號">
        <SoftCard className="divide-y divide-border/60">
          <Link
            to="/auth"
            className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors active:bg-surface/70"
          >
            <Cloud className="size-[18px] text-muted-foreground" strokeWidth={1.6} />
            <span className="flex-1 text-sm">登入／註冊雲端帳號</span>
            <ChevronRight className="size-4 text-muted-foreground" strokeWidth={1.6} />
          </Link>
        </SoftCard>
      </Section>


      <Section title="提醒設定">
        <SoftCard className="px-5 py-5">
          <p className="flex items-center gap-2 text-[15px] font-medium">🔔 重要日子提醒</p>
          <p className="mt-1 text-sm text-muted-foreground">
            這裡只保存提醒設定，暫時不會真的發送通知。
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
                    <p className="truncate text-sm">{row.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
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
                    className="rounded-full p-2 text-muted-foreground transition-transform duration-300 active:scale-90"
                  >
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
            <button
              key={key}
              type="button"
              onClick={() => setOpenSheet(key)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors active:bg-surface/70"
            >
              <Icon className="size-[18px] text-muted-foreground" strokeWidth={1.6} />
              <span className="flex-1 text-sm">{label}</span>
              <ChevronRight className="size-4 text-muted-foreground" strokeWidth={1.6} />
            </button>
          ))}
        </SoftCard>
      </Section>

      <Section title="Premium">
        <SoftCard className="flex items-center gap-4 px-5 py-5">
          <div className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Sparkles className="size-5" strokeWidth={1.6} />
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-medium">IdolDays Premium</p>
            <p className="mt-1 text-sm text-muted-foreground">敬請期待</p>
          </div>
        </SoftCard>
      </Section>

      <p className="mt-10 text-center text-xs text-muted-foreground">版本 0.1.0（S0 Foundation）</p>

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
