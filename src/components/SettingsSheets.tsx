import { Check, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  DATE_FORMAT_OPTIONS,
  LANGUAGE_OPTIONS,
  THEME_OPTIONS,
  formatWithSetting,
  useSettings,
} from "@/lib/settings";
import { useIdolSource } from "@/lib/idols.source";
import { formatDaysBefore } from "@/lib/reminders";
import { useReminderSource } from "@/lib/reminders.source";
import { eventTypeMeta } from "@/lib/events";
import { useEventSource } from "@/lib/events.source";
import { scheduleEventNotifications } from "@/lib/event-notifications";

function SheetShell({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-border/60 bg-card px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="px-0 text-left">
          <SheetTitle className="text-xl">{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="space-y-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

function OptionRow({
  label,
  hint,
  selected,
  onSelect,
}: {
  label: string;
  hint?: string | undefined;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
        selected ? "bg-accent/50 text-foreground" : "bg-surface/60 text-muted-foreground"
      }`}
    >
      <span className="flex-1 text-sm">
        {label}
        {hint ? <span className="ml-2 text-xs text-muted-foreground">{hint}</span> : null}
      </span>
      {selected ? <Check className="size-4 text-primary" strokeWidth={2} /> : null}
    </button>
  );
}

function GroupTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs tracking-[0.08em] text-muted-foreground">{children}</p>;
}

export function GeneralSettingsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { settings, update } = useSettings();
  const { idols } = useIdolSource();

  return (
    <SheetShell
      open={open}
      onOpenChange={onOpenChange}
      title="一般設定"
      description="調整本命偶像、日期顯示與語言。"
    >
      <div>
        <GroupTitle>本命偶像</GroupTitle>
        {idols.length === 0 ? (
          <p className="rounded-2xl bg-surface/60 px-4 py-4 text-sm text-muted-foreground">
            還沒有偶像，先到「偶像」頁新增一位吧。
          </p>
        ) : (
          <div className="space-y-2">
            {idols.map((idol) => (
              <OptionRow
                key={idol.id}
                label={idol.name || "未命名"}
                hint={idol.groupName || undefined}
                selected={settings.primaryIdolId === idol.id}
                onSelect={() => update({ primaryIdolId: idol.id })}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <GroupTitle>日期顯示方式</GroupTitle>
        <div className="space-y-2">
          {DATE_FORMAT_OPTIONS.map((o) => (
            <OptionRow
              key={o.value}
              label={formatWithSetting("2026-09-07", o.value)}
              selected={settings.dateFormat === o.value}
              onSelect={() => update({ dateFormat: o.value })}
            />
          ))}
        </div>
      </div>

      <div>
        <GroupTitle>App 語言</GroupTitle>
        <div className="space-y-2">
          {LANGUAGE_OPTIONS.map((o) => (
            <OptionRow
              key={o.value}
              label={o.label}
              selected={settings.language === o.value}
              onSelect={() => update({ language: o.value })}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">目前介面文字仍以繁體中文為主。</p>
      </div>
    </SheetShell>
  );
}

export function NotificationSettingsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { reminders, updateReminder, removeReminder } = useReminderSource();
  const { idols } = useIdolSource();
  const { events } = useEventSource();

  const rows = reminders.map((r) => {
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
      event,
    };
  });

  async function setReminderEnabled(
    row: (typeof rows)[number],
    enabled: boolean,
  ) {
    await updateReminder(row.id, { enabled });
    if (row.event) {
      await scheduleEventNotifications(row.event, enabled ? row.daysBefore : null);
    }
  }

  async function deleteReminder(row: (typeof rows)[number]) {
    await removeReminder(row.id);
    if (row.event) {
      await scheduleEventNotifications(row.event, null);
    }
  }

  return (
    <SheetShell
      open={open}
      onOpenChange={onOpenChange}
      title="提醒通知"
      description="活動倒數提醒會同步到 App 並在 iPhone 排程；其他提醒會安全保留在帳號設定中。"
    >
      {rows.length === 0 ? (
        <p className="rounded-2xl bg-surface/60 px-4 py-4 text-sm text-muted-foreground">
          還沒有提醒。到日子或偶像頁面就能設定。
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {rows.map((row) => (
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
                onCheckedChange={(v) => void setReminderEnabled(row, v)}
              />
              <button
                type="button"
                aria-label={`刪除 ${row.title} 提醒`}
                onClick={() => void deleteReminder(row)}
                className="rounded-full p-2 text-muted-foreground transition-transform duration-300 active:scale-90"
              >
                <Trash2 className="size-4" strokeWidth={1.6} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </SheetShell>
  );
}

export function ThemeSettingsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { settings, update } = useSettings();

  return (
    <SheetShell
      open={open}
      onOpenChange={onOpenChange}
      title="外觀主題"
      description="選擇喜歡的介面亮度。"
    >
      <div className="space-y-2">
        {THEME_OPTIONS.map((o) => (
          <OptionRow
            key={o.value}
            label={o.label}
            hint={o.hint}
            selected={settings.theme === o.value}
            onSelect={() => update({ theme: o.value })}
          />
        ))}
      </div>
    </SheetShell>
  );
}
