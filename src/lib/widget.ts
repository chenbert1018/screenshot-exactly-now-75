import { daysSince, today } from "./dates";
import { eventCountdown, nextEvent, type IdolEvent } from "./events";
import type { Idol } from "./idols";

const IDOLS_KEY = "idoldays.idols.v1";
const EVENTS_KEY = "idoldays.events.v1";

export type WidgetIdol = {
  id: string;
  name: string;
  image?: string;
};

export type WidgetNextEvent = {
  id: string;
  idolId: string;
  idolName: string;
  idolImage?: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** 不會是負數，今天為 0 */
  daysRemaining: number;
  /** 「D-18」／「D-DAY」 */
  countdownLabel: string;
};

export type WidgetSnapshot = {
  idol: WidgetIdol | null;
  nextEvent: WidgetNextEvent | null;
  /** 陪伴天數（當天為第 1 天），沒有資料時為 0 */
  companionDays: number;
  generatedAt: string;
};

function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/**
 * 產生 Widget 用的純資料 Snapshot（只讀，不修改任何既有資料）。
 * 未帶入參數時會讀取 localStorage 的現有 Idol / Event。
 */
export function getWidgetSnapshot(
  input?: { idols?: Idol[]; events?: IdolEvent[]; base?: Date },
): WidgetSnapshot {
  const idols = input?.idols ?? readList<Idol>(IDOLS_KEY);
  const events = input?.events ?? readList<IdolEvent>(EVENTS_KEY);
  const base = input?.base ?? today();

  const primary = idols[0] ?? null;

  const idol: WidgetIdol | null = primary
    ? {
        id: primary.id,
        name: primary.name,
        ...(primary.photo ? { image: primary.photo } : {}),
      }
    : null;

  const upcoming = nextEvent(events, base);
  const countdown = upcoming ? eventCountdown(upcoming.date, base) : null;

  let next: WidgetNextEvent | null = null;
  if (upcoming && countdown && countdown.status !== "COMPLETED") {
    const owner = idols.find((i) => i.id === upcoming.idolId);
    next = {
      id: upcoming.id,
      idolId: upcoming.idolId,
      idolName: owner?.name ?? "",
      ...(owner?.photo ? { idolImage: owner.photo } : {}),
      title: upcoming.title,
      date: upcoming.date,
      daysRemaining: Math.max(0, countdown.daysUntil ?? 0),
      countdownLabel: countdown.ddayLabel,
    };
  }

  const since = primary ? daysSince(primary.sinceDate, base) : null;

  return {
    idol,
    nextEvent: next,
    companionDays: since?.days ?? 0,
    generatedAt: new Date().toISOString(),
  };
}
