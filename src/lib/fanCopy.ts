import { today } from "./dates";

/**
 * 全 App「追星人語氣」文案（純顯示層）。
 * 一律 deterministic-by-date：同一天固定同一句，不使用真正 random、不呼叫 AI／API。
 */

function seedOf(base: Date) {
  return base.getFullYear() * 10000 + (base.getMonth() + 1) * 100 + base.getDate();
}

function pick(list: readonly string[], base: Date, salt = 0) {
  return list[(seedOf(base) + salt) % list.length]!;
}

/* ---------------- NEXT D-DAY：Event ---------------- */

const EVENT_FAR = [
  "救命……再 {n} 天就要見到 {name} 了 😭",
  "再撐一下！！距離見到 {name} 還有 {n} 天 😭",
  "距離見面倒數 {n} 天，我已經開始期待了 🥹",
  "票都在手上了，再 {n} 天就真的要見到了ㅠㅠ",
] as const;

export function eventDdayLine(name: string, days: number, base: Date = today()) {
  if (days <= 0) return "今天見！！！！😭😭😭";
  if (days === 1) return "明天就要見到了？？？我真的可以嗎 😭";
  return pick(EVENT_FAR, base).replace("{n}", String(days)).replaceAll("{name}", name);
}

/* ---------------- NEXT D-DAY：Birthday ---------------- */

const BIRTHDAY_FAR = [
  "生日倒數 {n} 天，怎麼比自己的生日還期待 🥹",
  "{name} 生日快到了 🎂 已經開始期待了。",
  "我們家小孩生日快到了 👀 還有 {n} 天。",
] as const;

export function birthdayDdayLine(name: string, days: number, base: Date = today()) {
  if (days <= 0) return `今天是 ${name} 生日！！生日快樂啦 🥹🎂`;
  if (days === 1) return `明天就是 ${name} 生日了 🎂`;
  return pick(BIRTHDAY_FAR, base).replace("{n}", String(days)).replaceAll("{name}", name);
}

/* ---------------- NEXT D-DAY：Debut ---------------- */

const DEBUT_FAR = [
  "居然已經第 {n} 年了……🥹",
  "又一年了。還好我們都沒有走散。",
  "{name} 出道 {n} 週年了 💎",
  "第 {n} 年也請多多指教啦 🥹",
] as const;

export function debutDdayLine(
  name: string,
  days: number,
  years: number | null,
  base: Date = today(),
) {
  if (days <= 0) return "出道紀念日快樂！又陪你走過一年了 ♡";
  if (years && years > 0) {
    return pick(DEBUT_FAR, base).replaceAll("{n}", String(years)).replaceAll("{name}", name);
  }
  return `${name} 的出道紀念日快到了 ✨ 還有 ${days} 天。`;
}

/* ---------------- TODAY 今日陪伴 ---------------- */

const TODAY_LINES = [
  "今天也是被 {name} 帥到的一天，謝謝。",
  "本來今天心情有點差，看到 {name} 更新直接活過來。",
  "好了，今天又重新愛上一次。",
  "我推怎麼每天都可以有新的帥法。",
  "今天也是很需要 {name} 的一天。",
  "沒事，看看我推就好了。",
  "今天也有好好追星，現生也要好好過啦。",
  "誰懂……今天這個造型真的不行 🫠",
  "又被可愛到了，這合理嗎。",
  "今天也要好好生活，然後繼續喜歡他 ♡",
] as const;

const TODAY_LINES_NO_NAME = [
  "好了，今天又重新愛上一次。",
  "我推怎麼每天都可以有新的帥法。",
  "沒事，看看我推就好了。",
  "今天也有好好追星，現生也要好好過啦。",
  "又被可愛到了，這合理嗎。",
  "今天也要好好生活，然後繼續喜歡他 ♡",
] as const;

export function todayLine(name?: string, base: Date = today()) {
  if (!name) return pick(TODAY_LINES_NO_NAME, base);
  return pick(TODAY_LINES, base).replaceAll("{name}", name);
}

/* ---------------- 幾年前的今天 ---------------- */

const YEARS_AGO_LINES = [
  "等等……這居然已經是幾年前的事了 🥹",
  "救命，原來我們已經走這麼久了。",
  "那年的今天，我還不知道自己會喜歡你這麼久。",
  "翻到這張的時候還是會心動。",
  "時間真的過好快，這天我到現在還記得。",
] as const;

export function yearsAgoLine(base: Date = today()) {
  return pick(YEARS_AGO_LINES, base);
}

/* ---------------- 嗑糖 ---------------- */

const SUGAR_LINES = [
  "今天，也有一顆糖嗎？🍬",
  "這顆我可以嗑很久。",
  "誰懂……這個瞬間真的很甜。",
  "又找到一顆糖了 👀",
] as const;

export function sugarLine(base: Date = today()) {
  return pick(SUGAR_LINES, base);
}
