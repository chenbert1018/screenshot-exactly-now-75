/**
 * 以「當地日期」為基礎的日期計算工具（YYYY-MM-DD 字串，不引入日期套件）。
 */

export type ParsedDate = { y: number; m: number; d: number };

export function parseLocalDate(value?: string): ParsedDate | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

/** 當地時區的今天（時分秒歸零） */
export function today(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

function toDate(p: ParsedDate) {
  return new Date(p.y, p.m - 1, p.d);
}

const MS_DAY = 86400000;

export function diffInDays(from: Date, to: Date) {
  return Math.round((to.getTime() - from.getTime()) / MS_DAY);
}

export function formatMonthDay(value?: string) {
  const p = parseLocalDate(value);
  if (!p) return "";
  return `${p.m} 月 ${p.d} 日`;
}

export type Anniversary = {
  /** 距離下一次紀念日的天數，0 表示今天 */
  daysUntil: number;
  /** 下一次紀念日（當地日期） */
  nextDate: Date;
  /** 「D-18」或「D-Day」 */
  ddayLabel: string;
  /** 「還有 18 天」或「就是今天」 */
  humanLabel: string;
};

/** 計算每年重複的紀念日（生日、出道紀念日、自訂重要日子） */
export function nextAnniversary(value?: string, base: Date = today()): Anniversary | null {
  const p = parseLocalDate(value);
  if (!p) return null;

  let next = new Date(base.getFullYear(), p.m - 1, p.d);
  // 2/29 等不存在的日期會自動進位，仍視為當年的紀念日
  if (diffInDays(base, next) < 0) {
    next = new Date(base.getFullYear() + 1, p.m - 1, p.d);
  }
  const daysUntil = diffInDays(base, next);

  return {
    daysUntil,
    nextDate: next,
    ddayLabel: daysUntil === 0 ? "D-Day" : `D-${daysUntil}`,
    humanLabel: daysUntil === 0 ? "就是今天" : `還有 ${daysUntil} 天`,
  };
}

export type SinceCount = {
  /** 未來日期為 null */
  days: number | null;
  /** 「D+245」 */
  ddayLabel: string;
  /** 「喜歡你第 246 天」或「還沒開始」 */
  humanLabel: string;
  isFuture: boolean;
};

/** 計算陪伴天數：當天為第 1 天 */
export function daysSince(value?: string, base: Date = today()): SinceCount | null {
  const p = parseLocalDate(value);
  if (!p) return null;
  const start = toDate(p);
  const passed = diffInDays(start, base);

  if (passed < 0) {
    return { days: null, ddayLabel: "—", humanLabel: "還沒開始", isFuture: true };
  }

  const days = passed + 1;
  return {
    days,
    ddayLabel: `D+${passed}`,
    humanLabel: `喜歡你第 ${days} 天`,
    isFuture: false,
  };
}

export type PrimaryDay = {
  kind: "birthday" | "debut";
  title: string;
  ddayLabel: string;
  humanLabel: string;
  dateLabel: string;
  daysUntil: number;
};

/** 主要 D-Day：優先生日，其次出道紀念日 */
export function primaryDay(idol: { birthday?: string; debutDate?: string }, base: Date = today()): PrimaryDay | null {
  const birthday = nextAnniversary(idol.birthday, base);
  if (birthday) {
    return {
      kind: "birthday",
      title: "生日",
      ddayLabel: birthday.ddayLabel,
      humanLabel: birthday.humanLabel,
      dateLabel: formatMonthDay(idol.birthday),
      daysUntil: birthday.daysUntil,
    };
  }
  const debut = nextAnniversary(idol.debutDate, base);
  if (debut) {
    return {
      kind: "debut",
      title: "出道紀念日",
      ddayLabel: debut.ddayLabel,
      humanLabel: debut.daysUntil === 0 ? "今天是出道紀念日" : debut.humanLabel,
      dateLabel: formatMonthDay(idol.debutDate),
      daysUntil: debut.daysUntil,
    };
  }
  return null;
}
