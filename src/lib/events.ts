import { useCallback, useEffect, useState } from "react";
import { diffInDays, parseLocalDate, today } from "./dates";

const STORAGE_KEY = "idoldays.events.v1";

export const EVENT_TYPES = [
  { value: "BIRTHDAY", label: "生日", emoji: "🎂" },
  { value: "CONCERT", label: "演唱會", emoji: "🎤" },
  { value: "COMEBACK", label: "回歸", emoji: "💿" },
  { value: "TICKETING", label: "搶票", emoji: "🎟️" },
  { value: "VOTING", label: "投票", emoji: "🗳️" },
  { value: "MERCH", label: "周邊", emoji: "🎁" },
  { value: "FAN_MEETING", label: "Fan Meeting", emoji: "💌" },
  { value: "TRAVEL", label: "追星旅行", emoji: "✈️" },
  { value: "SUPPORT", label: "應援", emoji: "🕯️" },
  { value: "CUSTOM", label: "自訂", emoji: "✨" },
] as const;

export type EventType = (typeof EVENT_TYPES)[number]["value"];

export function eventTypeMeta(type: EventType) {
  return EVENT_TYPES.find((t) => t.value === type) ?? EVENT_TYPES[EVENT_TYPES.length - 1];
}

export type IdolEvent = {
  id: string;
  idolId: string;
  title: string;
  type: EventType;
  /** YYYY-MM-DD */
  date: string;
  note: string;
  createdAt: number;
};

export type EventDraft = Omit<IdolEvent, "id" | "createdAt">;

export const emptyEventDraft: EventDraft = {
  idolId: "",
  title: "",
  type: "CONCERT",
  date: "",
  note: "",
};

export type EventStatus = "UPCOMING" | "TODAY" | "COMPLETED";

export type EventCountdown = {
  status: EventStatus;
  /** 未來事件的剩餘天數，已結束為 null */
  daysUntil: number | null;
  /** 「D-18」／「D-DAY」／「已結束」 */
  ddayLabel: string;
  /** 「2026.09.22」 */
  dotDate: string;
  /** 「2026年9月22日」 */
  fullDate: string;
};

export function eventCountdown(date: string, base: Date = today()): EventCountdown | null {
  const p = parseLocalDate(date);
  if (!p) return null;
  const target = new Date(p.y, p.m - 1, p.d);
  const delta = diffInDays(base, target);
  const pad = (n: number) => String(n).padStart(2, "0");
  const dotDate = `${p.y}.${pad(p.m)}.${pad(p.d)}`;
  const fullDate = `${p.y}年${p.m}月${p.d}日`;

  if (delta > 0) {
    return { status: "UPCOMING", daysUntil: delta, ddayLabel: `D-${delta}`, dotDate, fullDate };
  }
  if (delta === 0) {
    return { status: "TODAY", daysUntil: 0, ddayLabel: "D-DAY", dotDate, fullDate };
  }
  return { status: "COMPLETED", daysUntil: null, ddayLabel: "已結束", dotDate, fullDate };
}

/** 即將到來（含今天）由近到遠，已結束的放最後（由近到遠回推） */
export function sortEvents(list: IdolEvent[], base: Date = today()) {
  const upcoming: IdolEvent[] = [];
  const past: IdolEvent[] = [];
  for (const e of list) {
    const c = eventCountdown(e.date, base);
    if (c && c.status !== "COMPLETED") upcoming.push(e);
    else past.push(e);
  }
  const byDate = (a: IdolEvent, b: IdolEvent) =>
    a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1;
  upcoming.sort(byDate);
  past.sort((a, b) => (a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? 1 : -1));
  return { upcoming, past, all: [...upcoming, ...past] };
}

/** 首頁 NEXT D-DAY：最近的未來事件（含今天）；同日取最早建立的 */
export function nextEvent(list: IdolEvent[], base: Date = today()): IdolEvent | undefined {
  return sortEvents(list, base).upcoming[0];
}

function read(): IdolEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as IdolEvent[]) : [];
  } catch {
    return [];
  }
}

function write(list: IdolEvent[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota or unavailable storage — keep in-memory state only */
  }
}

const listeners = new Set<(list: IdolEvent[]) => void>();

function newEventId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useEvents() {
  const [events, setEvents] = useState<IdolEvent[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEvents(read());
    setReady(true);
    const fn = (list: IdolEvent[]) => setEvents(list);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const commit = useCallback((list: IdolEvent[]) => {
    write(list);
    listeners.forEach((fn) => fn(list));
  }, []);

  const addEvent = useCallback(
    (draft: EventDraft) => {
      const item: IdolEvent = { ...draft, id: newEventId(), createdAt: Date.now() };
      commit([...read(), item]);
      return item;
    },
    [commit],
  );

  const updateEvent = useCallback(
    (id: string, draft: EventDraft) => {
      commit(read().map((e) => (e.id === id ? { ...e, ...draft } : e)));
    },
    [commit],
  );

  const removeEvent = useCallback(
    (id: string) => {
      commit(read().filter((e) => e.id !== id));
    },
    [commit],
  );

  return { events, ready, addEvent, updateEvent, removeEvent };
}
