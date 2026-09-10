import {
  cancelEventNotifications,
} from "./event-notifications";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth";
import { useEvents, type EventDraft, type IdolEvent } from "./events";
import {
  createCloudEvent,
  deleteCloudEvent,
  listCloudEvents,
  updateCloudEvent,
} from "./events.cloud";
import {
  mergeFanWeatherSettings,
  removeFanWeatherSettings,
  saveFanWeatherSettings,
} from "./fan-weather-settings";
import {
  refreshFanWeatherNotification,
} from "./fan-weather-notifications";
import { ensureIdolMigration } from "./idols.source";
import {
  getMilestoneMigrationRecord,
  migrateLocalMilestones,
} from "./milestones.source";

/**
 * Event 資料來源切換層。
 *
 * 未登入 → localStorage（idoldays.events.v1，行為完全不變）
 * 已登入 → Supabase events（第一次登入時一次性複製本機日子，不刪除本機資料）
 *
 * 只做資料來源接線：不改 Event 資料模型、倒數邏輯、排序與畫面。
 */

/* ------------------------- migration metadata ------------------------- */

export const EVENT_MIGRATION_KEY = "idoldays.cloudMigration.events.v1";

export type EventMigrationRecord = {
  version: 1;
  userId: string;
  /** local event id → cloud event id */
  map: Record<string, string>;
  done: boolean;
  warnings: string[];
  migratedAt?: string;
};

type Store = Record<string, EventMigrationRecord>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(EVENT_MIGRATION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  try {
    window.localStorage.setItem(EVENT_MIGRATION_KEY, JSON.stringify(store));
  } catch {
    /* 儲存空間不可用時忽略，下次登入會再嘗試 */
  }
}

export function getEventMigrationRecord(userId: string): EventMigrationRecord {
  return (
    readStore()[userId] ?? { version: 1, userId, map: {}, done: false, warnings: [] }
  );
}

function saveEventMigrationRecord(record: EventMigrationRecord) {
  const store = readStore();
  store[record.userId] = record;
  writeStore(store);
}

export function readLocalEvents(): IdolEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("idoldays.events.v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as IdolEvent[]) : [];
  } catch {
    return [];
  }
}

export type EventMigrationResult = {
  created: number;
  skipped: number;
  warnings: string[];
  /** local event id → cloud event id（含先前已完成的對照） */
  map: Record<string, string>;
};

/**
 * 一次性把本機日子複製到雲端。可安全重跑：
 * - 已有 localId → cloudId 對照且雲端仍存在的不再建立
 * - 雲端已有同偶像 + 同標題 + 同類型 + 同日期的不再建立
 * - 找不到偶像對照時保留本機資料並回報 warning（不建立錯誤關聯的日子）
 * - 從不刪除或覆蓋任何資料
 */
export async function migrateLocalEvents(
  userId: string,
  idolMap: Record<string, string>,
): Promise<EventMigrationResult> {
  const record = getEventMigrationRecord(userId);
  const local = readLocalEvents();
  const cloud = await listCloudEvents();

  const map = { ...record.map };
  const warnings: string[] = [];
  const cloudList = [...cloud];
  let created = 0;
  let skipped = 0;

  for (const item of local) {
    const mapped = map[item.id];
    if (mapped && cloudList.some((c) => c.id === mapped)) {
      skipped += 1;
      continue;
    }

    // local idol id → cloud idol id（雲端 id 本身也可能直接命中）
    const cloudIdolId = idolMap[item.idolId] ?? item.idolId;
    const idolKnown =
      Boolean(idolMap[item.idolId]) || Object.values(idolMap).includes(item.idolId);
    if (!idolKnown) {
      warnings.push(`「${item.title}」找不到對應的雲端偶像，已保留在本機`);
      continue;
    }

    const existing = cloudList.find(
      (c) =>
        c.idolId === cloudIdolId &&
        c.title.trim() === item.title.trim() &&
        c.type === item.type &&
        c.date === item.date,
    );
    if (existing) {
      map[item.id] = existing.id;
      skipped += 1;
      continue;
    }

    const draft: EventDraft = {
      idolId: cloudIdolId,
      title: item.title,
      type: item.type,
      date: item.date,
      note: item.note ?? "",
    };
    try {
      const createdEvent = await createCloudEvent(draft, userId);
      cloudList.push(createdEvent);
      map[item.id] = createdEvent.id;
      created += 1;
    } catch {
      warnings.push(`「${item.title}」搬移失敗，已保留在本機`);
    }
  }

  saveEventMigrationRecord({
    version: 1,
    userId,
    map,
    done: warnings.length === 0,
    warnings,
    migratedAt: new Date().toISOString(),
  });

  return { created, skipped, warnings, map };
}

/* ------------------------- migration orchestration ------------------------- */

/** 同一次瀏覽中避免多個畫面同時搬移（造成重複資料） */
const inflight = new Map<
  string,
  Promise<{ idolMap: Record<string, string>; eventMap: Record<string, string> }>
>();

/**
 * 依序完成 偶像 → 日子 → 里程碑 migration，回傳偶像與日子的對照表。
 * 可安全重跑，且同一時間只會執行一次。
 */
export function ensureEventMigration(userId: string) {
  const running = inflight.get(userId);
  if (running) return running;
  const task = runEventMigration(userId).finally(() => inflight.delete(userId));
  inflight.set(userId, task);
  return task;
}

async function runEventMigration(userId: string) {
  // 1. 先確認偶像 migration 完成，取得 local idol → cloud idol 對照
  const idolMap = await ensureIdolMigration(userId);

  // 2. 再搬日子（可安全重跑），完成後才寫入 migration 標記
  const eventRecord = getEventMigrationRecord(userId);
  const eventMap = eventRecord.done
    ? eventRecord.map
    : (await migrateLocalEvents(userId, idolMap)).map;

  // 3. 日子對照完成後才搬里程碑
  if (!getMilestoneMigrationRecord(userId).done) {
    await migrateLocalMilestones(userId, eventMap);
  }

  return { idolMap, eventMap };
}

/* --------------------------- data source hook --------------------------- */

export type EventSource = {
  events: IdolEvent[];
  ready: boolean;
  mode: "local" | "cloud";
  error: string | null;
  addEvent: (draft: EventDraft) => Promise<void>;
  updateEvent: (id: string, draft: EventDraft) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  reload: () => void;
};

export function useEventSource(): EventSource {
  const { user, loading: authLoading } = useAuth();
  const local = useEvents();

  const [cloudEvents, setCloudEvents] = useState<IdolEvent[]>([]);
  const [cloudReady, setCloudReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setCloudEvents([]);
      setCloudReady(false);
      setError(null);
      return;
    }

    let active = true;
    (async () => {
      try {
        await ensureEventMigration(userId);

        const list = await listCloudEvents();
        if (!active) return;
        setCloudEvents(list.map((event) => mergeFanWeatherSettings(event)));
        setError(null);
        setCloudReady(true);
      } catch (e) {
        if (!active) return;
        // 雲端失敗時不清空任何資料，只顯示錯誤狀態
        setError(e instanceof Error ? e.message : "雲端資料讀取失敗");
        setCloudReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [userId, tick]);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  const isCloud = Boolean(userId);
  const events = isCloud ? cloudEvents : local.events;
  const ready = isCloud ? cloudReady : local.ready && !authLoading;

  const addEvent = useCallback(
    async (draft: EventDraft) => {
      if (isCloud && userId) {
        const created = await createCloudEvent(draft, userId);

        saveFanWeatherSettings(created.id, {
          locationName: draft.locationName ?? "",
          city: draft.city ?? "",
          weatherEnabled: Boolean(draft.weatherEnabled),
          weatherTone: draft.weatherTone ?? "SUNSHINE",
        });

        const eventWithWeather =
          mergeFanWeatherSettings(created);

        void refreshFanWeatherNotification(
          eventWithWeather,
        );

        reload();
        return;
      }
      const created = local.addEvent(draft);

      void refreshFanWeatherNotification(created);
    },
    [isCloud, userId, local, reload],
  );

  const updateEvent = useCallback(
    async (id: string, draft: EventDraft) => {
      if (isCloud) {
        await updateCloudEvent(id, draft);

        saveFanWeatherSettings(id, {
          locationName: draft.locationName ?? "",
          city: draft.city ?? "",
          weatherEnabled: Boolean(draft.weatherEnabled),
          weatherTone: draft.weatherTone ?? "SUNSHINE",
        });

        const updatedEvent: IdolEvent = {
          ...draft,
          id,
          createdAt:
            cloudEvents.find((event) => event.id === id)
              ?.createdAt ?? Date.now(),
        };

        void refreshFanWeatherNotification(
          updatedEvent,
          { cancelStaleBeforeRefresh: true },
        );

        reload();
        return;
      }
      local.updateEvent(id, draft);

      const existing =
        local.events.find((event) => event.id === id);

      if (existing) {
        const updatedEvent: IdolEvent = {
          ...existing,
          ...draft,
        };

        void refreshFanWeatherNotification(
          updatedEvent,
          { cancelStaleBeforeRefresh: true },
        );
      }
    },
    [isCloud, local, reload],
  );

  const removeEvent = useCallback(
    async (id: string) => {
      await cancelEventNotifications(id);

      if (isCloud) {
        // 雲端會一併刪除該日子的里程碑（不影響偶像與帳號）
        await deleteCloudEvent(id);
        removeFanWeatherSettings(id);
        reload();
        return;
      }
      local.removeEvent(id);
    },
    [isCloud, local, reload],
  );

  return {
    events,
    ready,
    mode: isCloud ? "cloud" : "local",
    error,
    addEvent,
    updateEvent,
    removeEvent,
    reload,
  };
}
