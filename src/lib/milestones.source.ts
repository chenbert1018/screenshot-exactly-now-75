import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth";
import {
  sortMilestones,
  useMilestones,
  type Milestone,
  type MilestoneDraft,
} from "./milestones";
import {
  createCloudMilestone,
  deleteCloudMilestone,
  listAllCloudMilestones,
  listCloudMilestones,
  updateCloudMilestone,
} from "./milestones.cloud";

/**
 * Milestone 資料來源切換層。
 *
 * 未登入 → localStorage（idoldays.milestones.v1，行為完全不變）
 * 已登入 → Supabase milestones
 *
 * 只做資料來源接線：不改 Milestone 資料模型、排序與畫面。
 */

/* ------------------------- migration metadata ------------------------- */

export const MILESTONE_MIGRATION_KEY = "idoldays.cloudMigration.milestones.v1";

export type MilestoneMigrationRecord = {
  version: 1;
  userId: string;
  /** local milestone id → cloud milestone id */
  map: Record<string, string>;
  done: boolean;
  warnings: string[];
  migratedAt?: string;
};

type Store = Record<string, MilestoneMigrationRecord>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(MILESTONE_MIGRATION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  try {
    window.localStorage.setItem(MILESTONE_MIGRATION_KEY, JSON.stringify(store));
  } catch {
    /* 儲存空間不可用時忽略 */
  }
}

export function getMilestoneMigrationRecord(userId: string): MilestoneMigrationRecord {
  return readStore()[userId] ?? { version: 1, userId, map: {}, done: false, warnings: [] };
}

function saveMilestoneMigrationRecord(record: MilestoneMigrationRecord) {
  const store = readStore();
  store[record.userId] = record;
  writeStore(store);
}

export function readLocalMilestones(): Milestone[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("idoldays.milestones.v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Milestone[]) : [];
  } catch {
    return [];
  }
}

export type MilestoneMigrationResult = {
  created: number;
  skipped: number;
  warnings: string[];
  map: Record<string, string>;
};

/**
 * 一次性把本機里程碑複製到雲端，必須在日子 migration 完成之後執行。
 * - local event id → cloud event id 對照不存在時不建立，保留本機資料並回報 warning
 * - 已對照過或雲端已有相同（日子＋標題＋日期＋表情＋完成狀態）的不重複建立
 * - 從不刪除或覆蓋任何資料，可安全重跑
 */
export async function migrateLocalMilestones(
  userId: string,
  eventMap: Record<string, string>,
): Promise<MilestoneMigrationResult> {
  const record = getMilestoneMigrationRecord(userId);
  const local = readLocalMilestones();
  const cloud = await listAllCloudMilestones();

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

    const cloudEventId = eventMap[item.eventId];
    const eventKnown = Boolean(cloudEventId) || Object.values(eventMap).includes(item.eventId);
    if (!eventKnown) {
      warnings.push(`里程碑「${item.title}」找不到對應的雲端日子，已保留在本機`);
      continue;
    }
    const targetEventId = cloudEventId ?? item.eventId;

    const existing = cloudList.find(
      (c) =>
        c.eventId === targetEventId &&
        c.title.trim() === item.title.trim() &&
        (c.date || "") === (item.date || "") &&
        (c.emoji || "") === (item.emoji || "") &&
        c.completed === item.completed,
    );
    if (existing) {
      map[item.id] = existing.id;
      skipped += 1;
      continue;
    }

    try {
      const createdMilestone = await createCloudMilestone(
        targetEventId,
        { title: item.title, date: item.date, emoji: item.emoji },
        userId,
      );
      if (item.completed) {
        await updateCloudMilestone(createdMilestone.id, { completed: true });
        createdMilestone.completed = true;
      }
      cloudList.push(createdMilestone);
      map[item.id] = createdMilestone.id;
      created += 1;
    } catch {
      warnings.push(`里程碑「${item.title}」搬移失敗，已保留在本機`);
    }
  }

  saveMilestoneMigrationRecord({
    version: 1,
    userId,
    map,
    done: warnings.length === 0,
    warnings,
    migratedAt: new Date().toISOString(),
  });

  return { created, skipped, warnings, map };
}

/* --------------------------- data source hook --------------------------- */

export type MilestoneSource = {
  milestones: Milestone[];
  mode: "local" | "cloud";
  error: string | null;
  addMilestone: (eventId: string, draft: MilestoneDraft) => Promise<void>;
  updateMilestone: (id: string, draft: MilestoneDraft) => Promise<void>;
  toggleMilestone: (id: string) => Promise<void>;
  removeMilestone: (id: string) => Promise<void>;
};

export function useMilestoneSource(eventId?: string): MilestoneSource {
  const { user } = useAuth();
  const local = useMilestones(eventId);

  const [cloudList, setCloudList] = useState<Milestone[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const userId = user?.id ?? null;
  const isCloud = Boolean(userId);

  useEffect(() => {
    if (!userId || !eventId) {
      setCloudList([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        const list = await listCloudMilestones(eventId);
        if (!active) return;
        setCloudList(list);
        setError(null);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "雲端資料讀取失敗");
      }
    })();
    return () => {
      active = false;
    };
  }, [userId, eventId, tick]);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  const milestones = isCloud ? sortMilestones(cloudList) : local.milestones;

  const addMilestone = useCallback(
    async (id: string, draft: MilestoneDraft) => {
      if (isCloud && userId) {
        await createCloudMilestone(id, draft, userId);
        reload();
        return;
      }
      local.addMilestone(id, draft);
    },
    [isCloud, userId, local, reload],
  );

  const updateMilestone = useCallback(
    async (id: string, draft: MilestoneDraft) => {
      if (isCloud) {
        await updateCloudMilestone(id, draft);
        reload();
        return;
      }
      local.updateMilestone(id, draft);
    },
    [isCloud, local, reload],
  );

  const toggleMilestone = useCallback(
    async (id: string) => {
      if (isCloud) {
        const current = cloudList.find((m) => m.id === id);
        await updateCloudMilestone(id, { completed: !current?.completed });
        reload();
        return;
      }
      local.toggleMilestone(id);
    },
    [isCloud, cloudList, local, reload],
  );

  const removeMilestone = useCallback(
    async (id: string) => {
      if (isCloud) {
        await deleteCloudMilestone(id);
        reload();
        return;
      }
      local.removeMilestone(id);
    },
    [isCloud, local, reload],
  );

  return {
    milestones,
    mode: isCloud ? "cloud" : "local",
    error,
    addMilestone,
    updateMilestone,
    toggleMilestone,
    removeMilestone,
  };
}
