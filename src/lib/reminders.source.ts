import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth";
import {
  deleteReminder as deleteLocalReminder,
  deleteReminders as deleteLocalRemindersForEvent,
  deleteRemindersForIdol as deleteLocalRemindersForIdol,
  findReminder,
  loadReminders,
  setReminderFor as setLocalReminderFor,
  updateReminder as updateLocalReminder,
  useReminders,
  type Reminder,
  type ReminderTarget,
} from "./reminders";
import {
  createReminder,
  deleteReminder as deleteCloudReminder,
  listReminders,
  updateReminder as updateCloudReminder,
} from "./reminders.cloud";
import { ensureEventMigration } from "./events.source";

/**
 * Reminder 資料來源切換層。
 *
 * 未登入 → localStorage（idoldays.reminders.v1，行為完全不變）
 * 已登入 → Supabase reminders（第一次登入時一次性複製本機提醒，不刪除本機資料）
 *
 * 只做資料來源接線：不改提醒模型、預設天數與畫面，也不加入真正的推播。
 */

/* ------------------------- migration metadata ------------------------- */

export const REMINDER_MIGRATION_KEY = "idoldays.cloudMigration.reminders.v1";

export type ReminderMigrationRecord = {
  version: 1;
  userId: string;
  /** local reminder id → cloud reminder id */
  map: Record<string, string>;
  done: boolean;
  warnings: string[];
  migratedAt?: string;
};

type Store = Record<string, ReminderMigrationRecord>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(REMINDER_MIGRATION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  try {
    window.localStorage.setItem(REMINDER_MIGRATION_KEY, JSON.stringify(store));
  } catch {
    /* 儲存空間不可用時忽略，下次登入會再嘗試 */
  }
}

export function getReminderMigrationRecord(userId: string): ReminderMigrationRecord {
  return (
    readStore()[userId] ?? { version: 1, userId, map: {}, done: false, warnings: [] }
  );
}

function saveReminderMigrationRecord(record: ReminderMigrationRecord) {
  const store = readStore();
  store[record.userId] = record;
  writeStore(store);
}

/** local id → cloud id；找不到時回傳 null 並記 warning，絕不寫入本機 id */
export function mapId(
  localId: string | undefined,
  map: Record<string, string>,
  warnings: string[],
  label: string,
): string | null {
  if (!localId) return null;
  const mapped = map[localId];
  if (mapped) return mapped;
  if (Object.values(map).includes(localId)) return localId;
  warnings.push(label);
  return null;
}

export type ReminderMigrationResult = {
  created: number;
  skipped: number;
  warnings: string[];
  map: Record<string, string>;
};

/**
 * 一次性把本機提醒複製到雲端。可安全重跑：
 * - 已有對照且雲端仍存在的不再建立
 * - 雲端已有同類型 + 同日子 + 同偶像 + 同天數的不再建立
 * - 找不到日子／偶像對照時設為空關聯並回報 warning（絕不寫入本機 id）
 */
export async function migrateLocalReminders(
  userId: string,
  idolMap: Record<string, string>,
  eventMap: Record<string, string>,
): Promise<ReminderMigrationResult> {
  const record = getReminderMigrationRecord(userId);
  const local = loadReminders();
  const cloudList = [...(await listReminders())];

  const map = { ...record.map };
  const warnings: string[] = [];
  let created = 0;
  let skipped = 0;

  for (const item of local) {
    const mapped = map[item.id];
    if (mapped && cloudList.some((c) => c.id === mapped)) {
      skipped += 1;
      continue;
    }

    const cloudEventId = mapId(
      item.eventId,
      eventMap,
      warnings,
      "有一個提醒找不到對應的雲端日子，已改為不綁定日子",
    );
    const cloudIdolId = mapId(
      item.idolId,
      idolMap,
      warnings,
      "有一個提醒找不到對應的雲端偶像，已改為不綁定偶像",
    );

    const existing = cloudList.find(
      (c) =>
        c.type === item.type &&
        (c.eventId ?? null) === cloudEventId &&
        (c.idolId ?? null) === cloudIdolId &&
        c.daysBefore === item.daysBefore,
    );
    if (existing) {
      map[item.id] = existing.id;
      skipped += 1;
      continue;
    }

    try {
      const createdReminder = await createReminder(
        {
          type: item.type,
          daysBefore: item.daysBefore,
          enabled: item.enabled,
          eventId: cloudEventId,
          idolId: cloudIdolId,
        },
        userId,
      );
      cloudList.push(createdReminder);
      map[item.id] = createdReminder.id;
      created += 1;
    } catch {
      warnings.push("有一個提醒搬移失敗，已保留在本機");
    }
  }

  saveReminderMigrationRecord({
    version: 1,
    userId,
    map,
    done: warnings.length === 0,
    warnings,
    migratedAt: new Date().toISOString(),
  });

  return { created, skipped, warnings, map };
}

const inflight = new Map<string, Promise<void>>();

/** 依序完成 偶像 → 日子 → 提醒 migration（可安全重跑，同時只跑一次） */
export function ensureReminderMigration(userId: string) {
  const running = inflight.get(userId);
  if (running) return running;
  const task = (async () => {
    const { idolMap, eventMap } = await ensureEventMigration(userId);
    if (!getReminderMigrationRecord(userId).done) {
      await migrateLocalReminders(userId, idolMap, eventMap);
    }
  })().finally(() => inflight.delete(userId));
  inflight.set(userId, task);
  return task;
}

/* --------------------------- data source hook --------------------------- */

export type ReminderSource = {
  reminders: Reminder[];
  ready: boolean;
  mode: "local" | "cloud";
  error: string | null;
  remindersFor: (eventId: string) => Reminder[];
  reminderFor: (target: ReminderTarget) => Reminder | undefined;
  setReminderFor: (target: ReminderTarget, daysBefore: number | null) => Promise<void>;
  updateReminder: (id: string, patch: { enabled?: boolean; daysBefore?: number }) => Promise<void>;
  removeReminder: (id: string) => Promise<void>;
  removeRemindersForEvent: (eventId: string) => Promise<void>;
  removeRemindersForIdol: (idolId: string) => Promise<void>;
  reload: () => void;
};

export function useReminderSource(): ReminderSource {
  const { user, loading: authLoading } = useAuth();
  const local = useReminders();

  const [cloudReminders, setCloudReminders] = useState<Reminder[]>([]);
  const [cloudReady, setCloudReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setCloudReminders([]);
      setCloudReady(false);
      setError(null);
      return;
    }

    let active = true;
    (async () => {
      try {
        await ensureReminderMigration(userId);
        const list = await listReminders();
        if (!active) return;
        setCloudReminders(list);
        setError(null);
        setCloudReady(true);
      } catch (e) {
        if (!active) return;
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
  const reminders = isCloud ? cloudReminders : local.reminders;
  const ready = isCloud ? cloudReady : !authLoading;

  const remindersFor = useCallback(
    (eventId: string) => reminders.filter((r) => r.eventId === eventId),
    [reminders],
  );

  const reminderFor = useCallback(
    (target: ReminderTarget) => findReminder(reminders, target),
    [reminders],
  );

  const setFor = useCallback(
    async (target: ReminderTarget, daysBefore: number | null) => {
      if (!isCloud || !userId) {
        setLocalReminderFor(target, daysBefore);
        return;
      }
      const existing = findReminder(cloudReminders, target);
      if (daysBefore === null) {
        if (existing) await deleteCloudReminder(existing.id);
      } else if (existing) {
        await updateCloudReminder(existing.id, { daysBefore, enabled: true });
      } else {
        await createReminder(
          {
            type: target.type,
            daysBefore,
            enabled: true,
            eventId: target.eventId ?? null,
            idolId: target.idolId ?? null,
          },
          userId,
        );
      }
      reload();
    },
    [isCloud, userId, cloudReminders, reload],
  );

  const update = useCallback(
    async (id: string, patch: { enabled?: boolean; daysBefore?: number }) => {
      if (isCloud) {
        await updateCloudReminder(id, patch);
        reload();
        return;
      }
      updateLocalReminder(id, patch);
    },
    [isCloud, reload],
  );

  const removeReminder = useCallback(
    async (id: string) => {
      if (isCloud) {
        await deleteCloudReminder(id);
        reload();
        return;
      }
      deleteLocalReminder(id);
    },
    [isCloud, reload],
  );

  const removeRemindersForEvent = useCallback(
    async (eventId: string) => {
      if (isCloud) {
        const targets = cloudReminders.filter((r) => r.eventId === eventId);
        for (const r of targets) await deleteCloudReminder(r.id);
        reload();
        return;
      }
      deleteLocalRemindersForEvent(eventId);
    },
    [isCloud, cloudReminders, reload],
  );

  const removeRemindersForIdol = useCallback(
    async (idolId: string) => {
      if (isCloud) {
        const targets = cloudReminders.filter((r) => r.idolId === idolId);
        for (const r of targets) await deleteCloudReminder(r.id);
        reload();
        return;
      }
      deleteLocalRemindersForIdol(idolId);
    },
    [isCloud, cloudReminders, reload],
  );

  return {
    reminders,
    ready,
    mode: isCloud ? "cloud" : "local",
    error,
    remindersFor,
    reminderFor,
    setReminderFor: setFor,
    updateReminder: update,
    removeReminder,
    removeRemindersForEvent,
    removeRemindersForIdol,
    reload,
  };
}
