import { daysSince, today } from "./dates";
import { eventCountdown, eventTypeMeta, nextEvent, type IdolEvent } from "./events";
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

/* ------------------------------------------------------------------ *
 * Widget V2｜偶像陪伴內容引擎（純前端、deterministic、不影響 V1）
 * ------------------------------------------------------------------ */

const PREFS_KEY = "idoldays.widget.preferences.v1";

export const WIDGET_CONTENT_TYPES = [
  "IDOL",
  "MESSAGE",
  "DECORATION",
  "MOOD",
  "COUNTDOWN",
] as const;

export type WidgetContentType = (typeof WIDGET_CONTENT_TYPES)[number];

export type WidgetPreferences = {
  idolId?: string;
  enabledContents: WidgetContentType[];
};

export type WidgetMood = { label: string; emoji: string };

export type WidgetDecoration = { type: string; emoji?: string; label: string };

export type WidgetImportantDate = {
  eventId?: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  daysRemaining: number;
  countdownLabel: string;
};

export type WidgetCompanionContent = {
  idol: WidgetIdol | null;
  dailyMessage: string;
  mood: WidgetMood;
  decoration: WidgetDecoration;
  importantDate: WidgetImportantDate | null;
  /** YYYY-MM-DD */
  generatedFor: string;
};

export function getDefaultWidgetPreferences(): WidgetPreferences {
  return { enabledContents: [...WIDGET_CONTENT_TYPES] };
}

function sanitizePreferences(value: unknown): WidgetPreferences {
  const fallback = getDefaultWidgetPreferences();
  if (!value || typeof value !== "object") return fallback;
  const raw = value as Partial<WidgetPreferences>;
  const list = Array.isArray(raw.enabledContents)
    ? raw.enabledContents.filter((t): t is WidgetContentType =>
        (WIDGET_CONTENT_TYPES as readonly string[]).includes(t as string),
      )
    : null;
  return {
    ...(typeof raw.idolId === "string" && raw.idolId ? { idolId: raw.idolId } : {}),
    enabledContents: list ?? fallback.enabledContents,
  };
}

export function loadWidgetPreferences(): WidgetPreferences {
  if (typeof window === "undefined") return getDefaultWidgetPreferences();
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return getDefaultWidgetPreferences();
    return sanitizePreferences(JSON.parse(raw));
  } catch {
    return getDefaultWidgetPreferences();
  }
}

export function saveWidgetPreferences(prefs: WidgetPreferences): WidgetPreferences {
  const clean = sanitizePreferences(prefs);
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(clean));
  } catch {
    /* 儲存空間不可用時只保留當下狀態 */
  }
  return clean;
}

export function updateWidgetPreferences(patch: Partial<WidgetPreferences>): WidgetPreferences {
  return saveWidgetPreferences({ ...loadWidgetPreferences(), ...patch });
}

export function isWidgetContentEnabled(prefs: WidgetPreferences, type: WidgetContentType) {
  return prefs.enabledContents.includes(type);
}

/* ---------------------------- 每日一句 ---------------------------- */

const DAILY_MESSAGES = [
  "今天也辛苦了，慢慢來 ♡",
  "今天也陪他走了一小段路。",
  "喜歡一個人的日子，也值得被收藏。",
  "今天也偷偷喜歡了一下。",
  "不用急，今天也好好生活吧 ♡",
  "再一下下，就能見面了。",
  "今天也有一點點期待。",
  "辛苦了，回家好好休息。",
  "這一天，也值得收藏。",
] as const;

function toDateKey(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 以日期為 seed，同一天永遠同一句 */
export function getDailyWidgetMessage(date: Date = today()): string {
  const seed = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
  const index = ((Math.floor(seed) % DAILY_MESSAGES.length) + DAILY_MESSAGES.length) %
    DAILY_MESSAGES.length;
  return DAILY_MESSAGES[index]!;
}

/* ---------------------------- 今日心情 ---------------------------- */

const MOODS: WidgetMood[] = [
  { emoji: "🌙", label: "慢慢準備新的一週" }, // Sunday
  { emoji: "☕", label: "星期一，慢慢來" },
  { emoji: "🌱", label: "今天也穩穩前進" },
  { emoji: "✦", label: "撐過一半了" },
  { emoji: "🌷", label: "再一下下" },
  { emoji: "♡", label: "今天值得開心" },
  { emoji: "✨", label: "今天好好享受" },
];

export function getWidgetMood(date: Date = today()): WidgetMood {
  return MOODS[date.getDay()]!;
}

/* ---------------------------- 小裝飾 ---------------------------- */

const HOLIDAYS: Record<string, WidgetDecoration> = {
  "01-01": { type: "NEW_YEAR", emoji: "✦", label: "新的一年開始了" },
  "02-14": { type: "VALENTINE", emoji: "💗", label: "情人節快樂 ♡" },
  "03-14": { type: "WHITE_DAY", emoji: "♡", label: "白色情人節" },
  "10-31": { type: "HALLOWEEN", emoji: "🎃", label: "萬聖節" },
  "12-25": { type: "CHRISTMAS", emoji: "🎄", label: "聖誕節快樂" },
};

const EVENT_DECORATIONS: Record<string, WidgetDecoration> = {
  CONCERT: { type: "CONCERT", emoji: "🎫", label: "今天是見面的日子" },
  FAN_MEETING: { type: "CONCERT", emoji: "🎫", label: "今天是見面的日子" },
  COMEBACK: { type: "COMEBACK", emoji: "✨", label: "新的舞台開始了" },
};

export function getWidgetDecoration(input: {
  date?: Date;
  idol?: Idol | null;
  events?: IdolEvent[];
}): WidgetDecoration {
  const date = input.date ?? today();
  const key = toDateKey(date).slice(5);

  // 1. 偶像生日
  const birthday = input.idol?.birthday;
  if (birthday && birthday.slice(5) === key) {
    return { type: "BIRTHDAY", emoji: "🎂", label: "生日模式" };
  }

  // 2. 今天的 Event
  const todayEvent = (input.events ?? []).find((e) => e.date === toDateKey(date));
  if (todayEvent) {
    const preset = EVENT_DECORATIONS[todayEvent.type];
    if (preset) return preset;
    return { type: "EVENT", emoji: eventTypeMeta(todayEvent.type).emoji, label: "今天是特別的日子" };
  }

  // 3. 節日
  const holiday = HOLIDAYS[key];
  if (holiday) return holiday;

  // 4. 一般日子
  return { type: "NORMAL", emoji: "✦", label: "平常的一天，也很好" };
}

/* ---------------------------- 內容組合 ---------------------------- */

export function getWidgetCompanionContent(
  input?: {
    idols?: Idol[];
    events?: IdolEvent[];
    date?: Date;
    preferences?: WidgetPreferences;
  },
): WidgetCompanionContent {
  const idols = input?.idols ?? readList<Idol>(IDOLS_KEY);
  const events = input?.events ?? readList<IdolEvent>(EVENTS_KEY);
  const date = input?.date ?? today();
  const prefs = sanitizePreferences(input?.preferences ?? loadWidgetPreferences());

  const chosen =
    (prefs.idolId ? idols.find((i) => i.id === prefs.idolId) : undefined) ?? idols[0] ?? null;

  const idol: WidgetIdol | null = chosen
    ? { id: chosen.id, name: chosen.name, ...(chosen.photo ? { image: chosen.photo } : {}) }
    : null;

  const scoped = chosen ? events.filter((e) => e.idolId === chosen.id) : events;
  const upcoming = nextEvent(scoped, date);
  const countdown = upcoming ? eventCountdown(upcoming.date, date) : null;

  let importantDate: WidgetImportantDate | null = null;
  if (upcoming && countdown && countdown.status !== "COMPLETED") {
    const days = Math.max(0, countdown.daysUntil ?? 0);
    importantDate = {
      eventId: upcoming.id,
      title: upcoming.title,
      date: upcoming.date,
      daysRemaining: days,
      countdownLabel: days === 0 ? "今天見 ♡" : countdown.ddayLabel,
    };
  }

  return {
    idol,
    dailyMessage: getDailyWidgetMessage(date),
    mood: getWidgetMood(date),
    decoration: getWidgetDecoration({ date, idol: chosen, events: scoped }),
    importantDate,
    generatedFor: toDateKey(date),
  };
}
