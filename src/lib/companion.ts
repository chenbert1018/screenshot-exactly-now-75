import { daysSince, nextAnniversary, primaryDay, today } from "./dates";

const MESSAGES = [
  "今天也一起度過吧。",
  "今天，也有一個人值得你想起。",
  "喜歡一個人的日子，也值得被記住。",
  "今天也把喜歡，好好收藏起來。",
  "又一起走過一天了。",
  "今天也在喜歡你的路上。",
] as const;

/** 同一天固定同一則文案（依當地日期決定） */
export function dailyMessage(base: Date = today()) {
  const seed = base.getFullYear() * 10000 + (base.getMonth() + 1) * 100 + base.getDate();
  return MESSAGES[seed % MESSAGES.length];
}

/** 「9 月 4 日・星期五」 */
export function todayLabel(base: Date = today()) {
  const week = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][base.getDay()];
  return `${base.getMonth() + 1} 月 ${base.getDate()} 日・${week}`;
}

/** 今天的小提醒（僅前端提示，無通知系統） */
export function dailyReminder(
  idol: { birthday?: string; debutDate?: string },
  base: Date = today(),
) {
  const birthday = nextAnniversary(idol.birthday, base);
  if (birthday) {
    const d = birthday.daysUntil;
    if (d === 0) return "今天是他的生日 ♡";
    if (d === 1) return "明天就是他的生日。";
    if (d <= 7) return "他的生日快到了。";
    if (d <= 30) return "再過一個月左右，就是他的生日。";
  }
  const debut = nextAnniversary(idol.debutDate, base);
  if (debut) {
    if (debut.daysUntil === 0) return "今天是出道紀念日。";
    if (debut.daysUntil <= 7) return "出道紀念日快到了。";
  }
  return "今天也記得留一點時間給自己。";
}

/** 今日收藏：只挑一項最適合的內容 */
export function todayHighlight(
  idol: { birthday?: string; debutDate?: string; sinceDate?: string },
  base: Date = today(),
) {
  const day = primaryDay(idol, base);
  if (day && day.daysUntil === 0) {
    return day.kind === "birthday" ? "今天是他的生日。" : "今天是出道紀念日。";
  }

  const since = daysSince(idol.sinceDate, base);
  if (since && !since.isFuture) return `今天是喜歡他的第 ${since.days} 天。`;

  if (day) {
    return day.kind === "birthday"
      ? `距離生日還有 ${day.daysUntil} 天。`
      : `距離出道紀念日還有 ${day.daysUntil} 天。`;
  }
  return "今天也還在，這樣就很好。";
}
