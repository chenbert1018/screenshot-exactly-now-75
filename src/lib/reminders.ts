import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "idoldays.reminders.v1";

/** 固定的提醒時間（分鐘） */
export const REMINDER_OFFSETS = [
  { value: 43200, label: "30 天前" },
  { value: 10080, label: "7 天前" },
  { value: 1440, label: "1 天前" },
  { value: 180, label: "3 小時前" },
  { value: 60, label: "1 小時前" },
  { value: 10, label: "10 分鐘前" },
] as const;

export type ReminderOffset = (typeof REMINDER_OFFSETS)[number]["value"];

export type Reminder = {
  id: string;
  eventId: string;
  /** 事件前幾分鐘提醒 */
  offset: number;
  enabled: boolean;
  /** ISO 字串，方便未來給 Backend / Notification Scheduler 使用 */
  createdAt: string;
};

export function formatReminderOffset(offset: number): string {
  return REMINDER_OFFSETS.find((o) => o.value === offset)?.label ?? `${offset} 分鐘前`;
}

/** 依時間由遠到近排序後組成「7 天前 · 1 天前」 */
export function formatReminderSummary(list: Reminder[]): string {
  const active = list.filter((r) => r.enabled).sort((a, b) => b.offset - a.offset);
  if (active.length === 0) return "尚未設定提醒";
  return active.map((r) => formatReminderOffset(r.offset)).join(" · ");
}

function read(): Reminder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Reminder[]) : [];
  } catch {
    return [];
  }
}

function write(list: Reminder[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota or unavailable storage */
  }
}

const listeners = new Set<(list: Reminder[]) => void>();

function emit(list: Reminder[]) {
  write(list);
  listeners.forEach((fn) => fn(list));
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `reminder_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 取得某個 Event 的提醒 */
export function getReminders(eventId: string): Reminder[] {
  return read().filter((r) => r.eventId === eventId);
}

/** 以勾選的 offsets 覆寫某 Event 的提醒（不產生重複資料） */
export function saveReminders(eventId: string, offsets: number[]): Reminder[] {
  const all = read();
  const existing = all.filter((r) => r.eventId === eventId);
  const others = all.filter((r) => r.eventId !== eventId);
  const unique = Array.from(new Set(offsets)).sort((a, b) => b - a);

  const next = unique.map((offset) => {
    const prev = existing.find((r) => r.offset === offset);
    return prev
      ? { ...prev, enabled: true }
      : { id: newId(), eventId, offset, enabled: true, createdAt: new Date().toISOString() };
  });

  emit([...others, ...next]);
  return next;
}

/** 刪除某 Event 的所有提醒 */
export function deleteReminders(eventId: string) {
  emit(read().filter((r) => r.eventId !== eventId));
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    setReminders(read());
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

  return { reminders, remindersFor, saveReminders, deleteReminders, getReminders };
}
