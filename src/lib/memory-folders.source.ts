import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth";
import {
  sortFolders,
  useMemoryFolders,
  type MemoryFolder,
  type MemoryFolderDraft,
} from "./memory-folders";
import {
  createMemoryFolder,
  deleteMemoryFolder,
  listMemoryFolders,
  updateMemoryFolder,
} from "./memory-folders.cloud";
import { getMigrationRecord, migrateLocalIdols } from "./idols.source";

/**
 * Memory Folder 資料來源切換層。
 *
 * 未登入 → localStorage（idoldays.memoryFolders.v1，行為完全不變）
 * 已登入 → Supabase memory_folders（第一次登入時一次性複製本機資料夾，不刪除本機資料）
 *
 * 只做資料來源接線：不改資料模型、排序與畫面。
 */

/* ------------------------- migration metadata ------------------------- */

export const FOLDER_MIGRATION_KEY = "idoldays.cloudMigration.memoryFolders.v1";

export type FolderMigrationRecord = {
  version: 1;
  userId: string;
  /** local folder id → cloud folder id */
  map: Record<string, string>;
  done: boolean;
  warnings: string[];
  migratedAt?: string;
};

type Store = Record<string, FolderMigrationRecord>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(FOLDER_MIGRATION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  try {
    window.localStorage.setItem(FOLDER_MIGRATION_KEY, JSON.stringify(store));
  } catch {
    /* 儲存空間不可用時忽略，下次登入會再嘗試 */
  }
}

export function getFolderMigrationRecord(userId: string): FolderMigrationRecord {
  return (
    readStore()[userId] ?? { version: 1, userId, map: {}, done: false, warnings: [] }
  );
}

function saveFolderMigrationRecord(record: FolderMigrationRecord) {
  const store = readStore();
  store[record.userId] = record;
  writeStore(store);
}

export function readLocalFolders(): MemoryFolder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("idoldays.memoryFolders.v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MemoryFolder[]) : [];
  } catch {
    return [];
  }
}

/**
 * local idol id → cloud idol id。
 * 找不到對照時回傳 null（schema 允許為空），並記下 warning，
 * 絕不把 local idol id 直接寫入雲端。
 */
export function mapIdolId(
  localIdolId: string | undefined,
  idolMap: Record<string, string>,
  warnings: string[],
  label: string,
): string {
  if (!localIdolId) return "";
  const mapped = idolMap[localIdolId];
  if (mapped) return mapped;
  if (Object.values(idolMap).includes(localIdolId)) return localIdolId;
  warnings.push(`「${label}」找不到對應的雲端偶像，已改為不指定偶像`);
  return "";
}

export type FolderMigrationResult = {
  created: number;
  skipped: number;
  warnings: string[];
  map: Record<string, string>;
};

/**
 * 一次性把本機回憶資料夾複製到雲端。可安全重跑：
 * - 已有 localId → cloudId 對照且雲端仍存在的不再建立
 * - 雲端已有同偶像 + 同標題 + 同起訖日期的不再建立
 * - 從不刪除或覆蓋任何資料
 */
export async function migrateLocalMemoryFolders(
  userId: string,
  idolMap: Record<string, string>,
): Promise<FolderMigrationResult> {
  const record = getFolderMigrationRecord(userId);
  const local = readLocalFolders();
  const cloudList = [...(await listMemoryFolders())];

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

    const cloudIdolId = mapIdolId(item.idolId, idolMap, warnings, item.title);

    const existing = cloudList.find(
      (c) =>
        (c.idolId ?? "") === cloudIdolId &&
        c.title.trim() === item.title.trim() &&
        (c.startDate ?? "") === (item.startDate ?? "") &&
        (c.endDate ?? "") === (item.endDate ?? ""),
    );
    if (existing) {
      map[item.id] = existing.id;
      skipped += 1;
      continue;
    }

    const draft: MemoryFolderDraft = {
      idolId: cloudIdolId,
      title: item.title,
      description: item.description ?? "",
      coverPhoto: item.coverPhoto ?? "",
      startDate: item.startDate ?? "",
      endDate: item.endDate ?? "",
    };
    try {
      const createdFolder = await createMemoryFolder(draft, userId);
      cloudList.push(createdFolder);
      map[item.id] = createdFolder.id;
      created += 1;
    } catch {
      warnings.push(`「${item.title}」搬移失敗，已保留在本機`);
    }
  }

  saveFolderMigrationRecord({
    version: 1,
    userId,
    map,
    done: warnings.length === 0,
    warnings,
    migratedAt: new Date().toISOString(),
  });

  return { created, skipped, warnings, map };
}

/** 依序完成 偶像 → 資料夾 migration，回傳兩份對照表（可安全重跑） */
export async function ensureFolderMigration(userId: string) {
  const idolRecord = getMigrationRecord(userId);
  if (!idolRecord.done) await migrateLocalIdols(userId);
  const idolMap = getMigrationRecord(userId).map;

  const folderRecord = getFolderMigrationRecord(userId);
  const folderMap = folderRecord.done
    ? folderRecord.map
    : (await migrateLocalMemoryFolders(userId, idolMap)).map;

  return { idolMap, folderMap };
}

/* --------------------------- data source hook --------------------------- */

export type MemoryFolderSource = {
  folders: MemoryFolder[];
  ready: boolean;
  mode: "local" | "cloud";
  error: string | null;
  addFolder: (draft: MemoryFolderDraft) => Promise<void>;
  updateFolder: (id: string, draft: MemoryFolderDraft) => Promise<void>;
  removeFolder: (id: string) => Promise<void>;
  reload: () => void;
};

export function useMemoryFolderSource(): MemoryFolderSource {
  const { user, loading: authLoading } = useAuth();
  const local = useMemoryFolders();

  const [cloudFolders, setCloudFolders] = useState<MemoryFolder[]>([]);
  const [cloudReady, setCloudReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setCloudFolders([]);
      setCloudReady(false);
      setError(null);
      return;
    }

    let active = true;
    (async () => {
      try {
        await ensureFolderMigration(userId);
        const list = await listMemoryFolders();
        if (!active) return;
        setCloudFolders(list);
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
  const folders = isCloud ? sortFolders(cloudFolders) : local.folders;
  const ready = isCloud ? cloudReady : local.ready && !authLoading;

  const addFolder = useCallback(
    async (draft: MemoryFolderDraft) => {
      if (isCloud && userId) {
        await createMemoryFolder(draft, userId);
        reload();
        return;
      }
      local.addFolder(draft);
    },
    [isCloud, userId, local, reload],
  );

  const updateFolder = useCallback(
    async (id: string, draft: MemoryFolderDraft) => {
      if (isCloud) {
        await updateMemoryFolder(id, draft);
        reload();
        return;
      }
      local.updateFolder(id, draft);
    },
    [isCloud, local, reload],
  );

  const removeFolder = useCallback(
    async (id: string) => {
      if (isCloud) {
        // 雲端會一併刪除資料夾底下的回憶（不影響偶像、日子、里程碑、帳號）
        await deleteMemoryFolder(id);
        reload();
        return;
      }
      local.removeFolder(id);
    },
    [isCloud, local, reload],
  );

  return {
    folders,
    ready,
    mode: isCloud ? "cloud" : "local",
    error,
    addFolder,
    updateFolder,
    removeFolder,
    reload,
  };
}
