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
