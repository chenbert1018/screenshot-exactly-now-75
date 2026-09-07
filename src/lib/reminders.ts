import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "idoldays.reminders.v1";

export type ReminderType = "EVENT" | "BIRTHDAY" | "ANNIVERSARY";

export type Reminder = {
  id: string;
  eventId?: string;
  idolId?: string;
  type: ReminderType;
  /** 提前幾天提醒，0 = 當天 */
  daysBefore: number;
  enabled: boolean;
  createdAt: string;
};

/** 可選的提醒時機 */
export const DAYS_BEFORE_OPTIONS = [
  { value: 0, label: "當天" },
  { value: 1, label: "1 天前" },
  { value: 3, label: "3 天前" },
  { value: 7, label: "7 天前" },
] as const;

/** 新提醒的預設值 */
export const DEFAULT_DAYS_BEFORE = 3;

export function formatDaysBefore(daysBefore: number): string {
  if (daysBefore <= 0) return "當天";
  return `${daysBefore} 天前`;
}

/** 提醒文案預覽（只是文字，不會真的發送通知） */
export function reminderPreview(title: string, daysBefore: number): string {
  if (daysBefore <= 0) return `今天就是${title}，記得一起收藏這一天 ♡`;
  if (daysBefore === 1) return `再一下下，距離${title}只剩 1 天了 ♡`;
  return `距離${title}還有 ${daysBefore} 天 ♡`;
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `reminder_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

type LegacyReminder = Reminder & { offset?: number };

function normalize(raw: unknown): Reminder[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const r = item as LegacyReminder;
      if (!r || typeof r !== "object") return null;
      const daysBefore =
        typeof r.daysBefore === "number"
          ? r.daysBefore
          : typeof r.offset === "number"
            ? Math.max(0, Math.round(r.offset / 1440))
            : DEFAULT_DAYS_BEFORE;
      return {
        id: r.id ?? newId(),
        eventId: r.eventId,
        idolId: r.idolId,
        type: r.type ?? "EVENT",
        daysBefore,
        enabled: r.enabled !== false,
        createdAt: r.createdAt ?? new Date().toISOString(),
      } satisfies Reminder;
    })
    .filter((r): r is Reminder => Boolean(r));
}

export function loadReminders(): Reminder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return normalize(JSON.parse(raw));
  } catch {
    return [];
  }
}

const listeners = new Set<(list: Reminder[]) => void>();

export function saveReminders(list: Reminder[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota or unavailable storage */
  }
  listeners.forEach((fn) => fn(list));
}

export function addReminder(input: Omit<Reminder, "id" | "createdAt">): Reminder {
  const reminder: Reminder = { ...input, id: newId(), createdAt: new Date().toISOString() };
  saveReminders([...loadReminders(), reminder]);
  return reminder;
}

export function updateReminder(id: string, patch: Partial<Omit<Reminder, "id">>) {
  saveReminders(loadReminders().map((r) => (r.id === id ? { ...r, ...patch } : r)));
}

export function deleteReminder(id: string) {
  saveReminders(loadReminders().filter((r) => r.id !== id));
}

export type ReminderTarget = { type: ReminderType; eventId?: string; idolId?: string };

function matches(r: Reminder, target: ReminderTarget) {
  if (r.type !== target.type) return false;
  if (target.eventId) return r.eventId === target.eventId;
  if (target.idolId) return r.idolId === target.idolId;
  return false;
}

export function findReminder(list: Reminder[], target: ReminderTarget): Reminder | undefined {
  return list.find((r) => matches(r, target));
}

/** 設定（或清除）某個目標的提醒。daysBefore 為 null 代表「不提醒」 */
export function setReminderFor(target: ReminderTarget, daysBefore: number | null) {
  const list = loadReminders();
  const existing = list.find((r) => matches(r, target));
  if (daysBefore === null) {
    if (existing) saveReminders(list.filter((r) => r.id !== existing.id));
    return;
  }
  if (existing) {
    saveReminders(
      list.map((r) => (r.id === existing.id ? { ...r, daysBefore, enabled: true } : r)),
    );
    return;
  }
  saveReminders([
    ...list,
    {
      id: newId(),
      ...target,
      daysBefore,
      enabled: true,
      createdAt: new Date().toISOString(),
    },
  ]);
}

/** 取得某個 Event 的提醒（事件刪除時使用） */
export function getReminders(eventId: string): Reminder[] {
  return loadReminders().filter((r) => r.eventId === eventId);
}

export function deleteReminders(eventId: string) {
  saveReminders(loadReminders().filter((r) => r.eventId !== eventId));
}

export function deleteRemindersForIdol(idolId: string) {
  saveReminders(loadReminders().filter((r) => r.idolId !== idolId));
}

export function formatReminderSummary(list: Reminder[]): string {
  const active = list.filter((r) => r.enabled);
  if (active.length === 0) return "不提醒";
  return active.map((r) => formatDaysBefore(r.daysBefore)).join(" · ");
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    setReminders(loadReminders());
    const fn = (list: Reminder[]) => setReminders(list);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const remindersFor = useCallback(
    (eventId: string) => reminders.filter((r) => r.eventId === eventId),
    [reminders],
  );

  const reminderFor = useCallback(
    (target: ReminderTarget) => findReminder(reminders, target),
    [reminders],
  );

  return { reminders, remindersFor, reminderFor };
}
