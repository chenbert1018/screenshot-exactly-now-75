import { describe, expect, test } from "bun:test";
import { getWidgetSnapshot } from "./widget";
import type { Idol } from "./idols";
import type { IdolEvent } from "./events";

const base = new Date(2026, 8, 7); // 2026-09-07

const idol: Idol = {
  id: "i1",
  name: "WONYOUNG",
  groupName: "IVE",
  birthday: "2004-08-31",
  debutDate: "2021-12-01",
  fanName: "",
  favoriteColor: "",
  sinceDate: "2026-09-01",
  photo: "data:image/png;base64,AAA",
};

function ev(over: Partial<IdolEvent>): IdolEvent {
  return {
    id: "e1",
    idolId: "i1",
    title: "台北演唱會",
    type: "CONCERT",
    date: "2026-09-10",
    note: "",
    createdAt: 1,
    ...over,
  };
}

describe("getWidgetSnapshot", () => {
  test("有偶像＋未來 Event 時產生完整 Snapshot", () => {
    const s = getWidgetSnapshot({ idols: [idol], events: [ev({})], base });
    expect(s.idol).toEqual({ id: "i1", name: "WONYOUNG", image: idol.photo });
    expect(s.nextEvent?.id).toBe("e1");
    expect(s.nextEvent?.idolName).toBe("WONYOUNG");
    expect(s.nextEvent?.daysRemaining).toBe(3);
    expect(s.nextEvent?.countdownLabel).toBe("D-3");
    expect(typeof s.generatedAt).toBe("string");
  });

  test("沒有偶像時 idol = null", () => {
    const s = getWidgetSnapshot({ idols: [], events: [ev({})], base });
    expect(s.idol).toBeNull();
    expect(s.companionDays).toBe(0);
  });

  test("沒有未來 Event 時 nextEvent = null", () => {
    const s = getWidgetSnapshot({ idols: [idol], events: [], base });
    expect(s.nextEvent).toBeNull();
  });

  test("已過期的 Event 不會成為 nextEvent", () => {
    const s = getWidgetSnapshot({
      idols: [idol],
      events: [ev({ id: "old", date: "2026-08-01" })],
      base,
    });
    expect(s.nextEvent).toBeNull();
  });

  test("最近的未來 Event 優先", () => {
    const s = getWidgetSnapshot({
      idols: [idol],
      events: [ev({ id: "far", date: "2026-12-01" }), ev({ id: "near", date: "2026-09-09" })],
      base,
    });
    expect(s.nextEvent?.id).toBe("near");
  });

  test("daysRemaining 不得為負數（今天的 Event 為 0）", () => {
    const s = getWidgetSnapshot({
      idols: [idol],
      events: [ev({ date: "2026-09-07" })],
      base,
    });
    expect(s.nextEvent?.daysRemaining).toBe(0);
    expect(s.nextEvent?.countdownLabel).toBe("D-DAY");
  });

  test("companionDays 正確（當天為第 1 天）", () => {
    const s = getWidgetSnapshot({ idols: [idol], events: [], base });
    expect(s.companionDays).toBe(7);
  });
});

/* ---------------- Widget V2｜偶像陪伴內容引擎 ---------------- */

import {
  getDailyWidgetMessage,
  getDefaultWidgetPreferences,
  getWidgetCompanionContent,
  getWidgetDecoration,
  getWidgetMood,
  loadWidgetPreferences,
  saveWidgetPreferences,
  updateWidgetPreferences,
  type WidgetContentType,
} from "./widget";

const monday = new Date(2026, 8, 7); // 2026-09-07 星期一

// 測試環境的最小 localStorage stub（不影響瀏覽器行為）
const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
};
const localStorage = (globalThis as unknown as { window: { localStorage: Storage } }).window
  .localStorage;

function contentWith(over: { date?: Date; enabled?: WidgetContentType[]; idolId?: string } = {}) {
  return getWidgetCompanionContent({
    idols: [idol],
    events: [ev({})],
    date: over.date ?? monday,
    preferences: {
      enabledContents: over.enabled ?? getDefaultWidgetPreferences().enabledContents,
      ...(over.idolId ? { idolId: over.idolId } : {}),
    },
  });
}

describe("Widget V2 preferences", () => {
  test("預設五種內容全部開啟", () => {
    expect(getDefaultWidgetPreferences().enabledContents).toEqual([
      "IDOL",
      "MESSAGE",
      "DECORATION",
      "MOOD",
      "COUNTDOWN",
    ]);
  });

  test("preferences 可以儲存，且重新讀取（等同 refresh）仍存在", () => {
    saveWidgetPreferences({ idolId: "i1", enabledContents: ["MOOD"] });
    expect(loadWidgetPreferences()).toEqual({ idolId: "i1", enabledContents: ["MOOD"] });
    updateWidgetPreferences({ enabledContents: ["IDOL", "MESSAGE"] });
    expect(loadWidgetPreferences().enabledContents).toEqual(["IDOL", "MESSAGE"]);
    saveWidgetPreferences(getDefaultWidgetPreferences());
  });

  test("JSON 損壞時安全 fallback", () => {
    localStorage.setItem("idoldays.widget.preferences.v1", "{oops");
    expect(loadWidgetPreferences()).toEqual(getDefaultWidgetPreferences());
    localStorage.removeItem("idoldays.widget.preferences.v1");
    expect(loadWidgetPreferences()).toEqual(getDefaultWidgetPreferences());
  });

  test("可以只開啟其中一種內容", () => {
    for (const t of ["IDOL", "MESSAGE", "MOOD", "DECORATION", "COUNTDOWN"] as WidgetContentType[]) {
      const p = saveWidgetPreferences({ enabledContents: [t] });
      expect(p.enabledContents).toEqual([t]);
    }
    saveWidgetPreferences(getDefaultWidgetPreferences());
  });
});

describe("Widget V2 content engine", () => {
  test("每日一句 deterministic：同一天兩次結果相同", () => {
    expect(getDailyWidgetMessage(monday)).toBe(getDailyWidgetMessage(new Date(2026, 8, 7)));
    expect(contentWith().dailyMessage).toBe(contentWith().dailyMessage);
  });

  test("不同日期可以產生不同內容", () => {
    const a = contentWith();
    const b = contentWith({ date: new Date(2026, 8, 8) });
    expect(a.generatedFor).toBe("2026-09-07");
    expect(b.generatedFor).toBe("2026-09-08");
    expect(a.mood.label === b.mood.label).toBe(false);
  });

  test("星期一 mood", () => {
    expect(getWidgetMood(monday)).toEqual({ emoji: "☕", label: "星期一，慢慢來" });
    expect(getWidgetMood(new Date(2026, 8, 13)).emoji).toBe("🌙");
  });

  test("偶像生日優先於節日與 Event", () => {
    const d = new Date(2026, 11, 25); // 12/25 聖誕節
    const birthdayIdol = { ...idol, birthday: "2004-12-25" };
    const deco = getWidgetDecoration({ date: d, idol: birthdayIdol, events: [ev({ date: "2026-12-25" })] });
    expect(deco).toEqual({ type: "BIRTHDAY", emoji: "🎂", label: "生日模式" });
  });

  test("Event 當天：演唱會與 Comeback 裝飾", () => {
    expect(
      getWidgetDecoration({ date: monday, idol, events: [ev({ date: "2026-09-07" })] }),
    ).toEqual({ type: "CONCERT", emoji: "🎫", label: "今天是見面的日子" });
    expect(
      getWidgetDecoration({
        date: monday,
        idol,
        events: [ev({ date: "2026-09-07", type: "COMEBACK" })],
      }).type,
    ).toBe("COMEBACK");
  });

  test("節日與一般日期裝飾", () => {
    expect(getWidgetDecoration({ date: new Date(2026, 11, 25), idol, events: [] }).emoji).toBe("🎄");
    expect(getWidgetDecoration({ date: new Date(2026, 9, 31), idol, events: [] }).emoji).toBe("🎃");
    expect(getWidgetDecoration({ date: new Date(2027, 0, 1), idol, events: [] }).type).toBe("NEW_YEAR");
    expect(getWidgetDecoration({ date: monday, idol, events: [] }).type).toBe("NORMAL");
  });

  test("重要日子沿用 Event 邏輯，今天顯示「今天見 ♡」，無未來 Event 為 null", () => {
    expect(contentWith().importantDate?.countdownLabel).toBe("D-3");
    const todayEvent = getWidgetCompanionContent({
      idols: [idol],
      events: [ev({ date: "2026-09-07" })],
      date: monday,
    });
    expect(todayEvent.importantDate?.countdownLabel).toBe("今天見 ♡");
    expect(todayEvent.importantDate?.daysRemaining).toBe(0);
    const past = getWidgetCompanionContent({
      idols: [idol],
      events: [ev({ date: "2026-01-01" })],
      date: monday,
    });
    expect(past.importantDate).toBeNull();
  });

  test("可以指定 idolId，沒指定時使用主要偶像，沒有偶像時為 null", () => {
    const second = { ...idol, id: "i2", name: "YUJIN" };
    expect(
      getWidgetCompanionContent({ idols: [idol, second], events: [], date: monday }).idol?.id,
    ).toBe("i1");
    expect(
      getWidgetCompanionContent({
        idols: [idol, second],
        events: [],
        date: monday,
        preferences: { idolId: "i2", enabledContents: ["IDOL"] },
      }).idol?.name,
    ).toBe("YUJIN");
    expect(getWidgetCompanionContent({ idols: [], events: [], date: monday }).idol).toBeNull();
  });

  test("Widget V1 snapshot 仍然相容", () => {
    const s = getWidgetSnapshot({ idols: [idol], events: [ev({})], base: monday });
    expect(s.nextEvent?.countdownLabel).toBe("D-3");
    expect(s.companionDays).toBe(7);
  });
});
