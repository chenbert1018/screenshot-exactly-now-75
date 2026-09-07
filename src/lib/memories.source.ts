import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth";
import { sortMemories, useMemories, type Memory, type MemoryDraft } from "./memories";
import {
  createMemory,
  deleteMemory,
  listMemories,
  updateMemory as updateCloudMemory,
} from "./memories.cloud";
import { ensureFolderMigration, mapIdolId } from "./memory-folders.source";

/**
 * Memory 資料來源切換層。
 *
 * 未登入 → localStorage（idoldays.memories.v1，行為完全不變）
 * 已登入 → Supabase memories（第一次登入時一次性複製本機回憶，不刪除本機資料）
 */

/* ------------------------- migration metadata ------------------------- */

export const MEMORY_MIGRATION_KEY = "idoldays.cloudMigration.memories.v1";

export type MemoryMigrationRecord = {
  version: 1;
  userId: string;
  /** local memory id → cloud memory id */
  map: Record<string, string>;
  done: boolean;
  warnings: string[];
  migratedAt?: string;
};

type Store = Record<string, MemoryMigrationRecord>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(MEMORY_MIGRATION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  try {
    window.localStorage.setItem(MEMORY_MIGRATION_KEY, JSON.stringify(store));
  } catch {
    /* 儲存空間不可用時忽略，下次登入會再嘗試 */
  }
}

export function getMemoryMigrationRecord(userId: string): MemoryMigrationRecord {
  return (
    readStore()[userId] ?? { version: 1, userId, map: {}, done: false, warnings: [] }
  );
}

function saveMemoryMigrationRecord(record: MemoryMigrationRecord) {
  const store = readStore();
  store[record.userId] = record;
  writeStore(store);
}

export function readLocalMemories(): Memory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("idoldays.memories.v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Memory[]) : [];
  } catch {
    return [];
  }
}

export type MemoryMigrationResult = {
  created: number;
  skipped: number;
  warnings: string[];
  map: Record<string, string>;
};

/**
 * 一次性把本機回憶複製到雲端（必須在資料夾對照完成後執行）。可安全重跑：
 * - 已有 localId → cloudId 對照且雲端仍存在的不再建立
 * - 雲端已有同資料夾 + 同偶像 + 同標題 + 同日期 + 同筆記的不再建立
 * - 找不到資料夾對照時保留在本機並回報 warning（不建立錯誤關聯）
 */
export async function migrateLocalMemories(
  userId: string,
  folderMap: Record<string, string>,
  idolMap: Record<string, string>,
): Promise<MemoryMigrationResult> {
  const record = getMemoryMigrationRecord(userId);
  const local = readLocalMemories();
  const cloudList = [...(await listMemories())];

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

    const label = item.title || "未命名的回憶";
    const cloudFolderId =
      folderMap[item.folderId] ??
      (Object.values(folderMap).includes(item.folderId) ? item.folderId : "");
    if (!cloudFolderId) {
      warnings.push(`「${label}」找不到對應的雲端資料夾，已保留在本機`);
      continue;
    }

    const cloudIdolId = mapIdolId(item.idolId, idolMap, warnings, label);

    const existing = cloudList.find(
      (c) =>
        c.folderId === cloudFolderId &&
        (c.idolId ?? "") === cloudIdolId &&
        c.title.trim() === item.title.trim() &&
        (c.date ?? "") === (item.date ?? "") &&
        (c.note ?? "") === (item.note ?? ""),
    );
    if (existing) {
      map[item.id] = existing.id;
      skipped += 1;
      continue;
    }

    const draft: MemoryDraft = {
      title: item.title,
      date: item.date ?? "",
      note: item.note ?? "",
      photo: item.photo ?? "",
    };
    try {
      const createdMemory = await createMemory(cloudFolderId, draft, userId, cloudIdolId);
      cloudList.push(createdMemory);
      map[item.id] = createdMemory.id;
      created += 1;
    } catch {
      warnings.push(`「${label}」搬移失敗，已保留在本機`);
    }
  }

  saveMemoryMigrationRecord({
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

export type MemorySource = {
  memories: Memory[];
  all: Memory[];
  ready: boolean;
  mode: "local" | "cloud";
  error: string | null;
  addMemory: (folderId: string, draft: MemoryDraft, idolId?: string) => Promise<void>;
  updateMemory: (id: string, draft: MemoryDraft) => Promise<void>;
  removeMemory: (id: string) => Promise<void>;
  reload: () => void;
};

export function useMemorySource(folderId?: string): MemorySource {
  const { user, loading: authLoading } = useAuth();
  const local = useMemories(folderId);

  const [cloudMemories, setCloudMemories] = useState<Memory[]>([]);
  const [cloudReady, setCloudReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setCloudMemories([]);
      setCloudReady(false);
      setError(null);
      return;
    }

    let active = true;
    (async () => {
      try {
        // 1. 偶像 → 2. 資料夾 對照完成後，才搬回憶
        const { idolMap, folderMap } = await ensureFolderMigration(userId);
        if (!getMemoryMigrationRecord(userId).done) {
          await migrateLocalMemories(userId, folderMap, idolMap);
        }

        const list = await listMemories();
        if (!active) return;
        setCloudMemories(list);
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
  const all = isCloud ? cloudMemories : local.all;
  const memories = isCloud
    ? folderId
      ? sortMemories(cloudMemories.filter((m) => m.folderId === folderId))
      : cloudMemories
    : local.memories;
  const ready = isCloud ? cloudReady : local.ready && !authLoading;

  const addMemory = useCallback(
    async (id: string, draft: MemoryDraft, idolId?: string) => {
      if (isCloud && userId) {
        await createMemory(id, draft, userId, idolId);
        reload();
        return;
      }
      local.addMemory(id, draft, idolId);
    },
    [isCloud, userId, local, reload],
  );

  const update = useCallback(
    async (id: string, draft: MemoryDraft) => {
      if (isCloud) {
        await updateCloudMemory(id, draft);
        reload();
        return;
      }
      local.updateMemory(id, draft);
    },
    [isCloud, local, reload],
  );

  const removeMemory = useCallback(
    async (id: string) => {
      if (isCloud) {
        await deleteMemory(id);
        reload();
        return;
      }
      local.removeMemory(id);
    },
    [isCloud, local, reload],
  );

  return {
    memories,
    all,
    ready,
    mode: isCloud ? "cloud" : "local",
    error,
    addMemory,
    updateMemory: update,
    removeMemory,
    reload,
  };
}
