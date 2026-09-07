import { supabase } from "@/integrations/supabase/client";
import {
  findExistingImage,
  isDataUrl,
  isStorageRef,
  uploadImage,
  type MediaKind,
} from "./storage";

/**
 * 一次性把本機照片搬到 Supabase Storage（V1-C-5）。
 *
 * - 只處理已存在的三種圖片：Idol photo / Memory photo / Sugar image
 * - 一律沿用前面階段已建立的 local → cloud 對照，不自行猜測關聯
 * - 不刪除任何本機資料、不覆蓋雲端既有 Storage 圖片
 * - 單張失敗只記 warning，不讓整批 rollback
 *
 * 為了避免與 source layer 互相 import，這裡直接讀取既有 migration metadata
 * （localStorage），不重新建立任何關聯。
 */

export const STORAGE_MIGRATION_KEY = "idoldays.cloudMigration.storage.v1";

export type StorageMigrationRecord = {
  version: 1;
  userId: string;
  startedAt: string;
  completedAt: string | null;
  /** local record id → storage reference */
  idolMappings: Record<string, string>;
  memoryMappings: Record<string, string>;
  sugarMappings: Record<string, string>;
  warnings: string[];
  failed: boolean;
  completed: boolean;
};

type Store = Record<string, StorageMigrationRecord>;

function emptyRecord(userId: string): StorageMigrationRecord {
  return {
    version: 1,
    userId,
    startedAt: new Date().toISOString(),
    completedAt: null,
    idolMappings: {},
    memoryMappings: {},
    sugarMappings: {},
    warnings: [],
    failed: false,
    completed: false,
  };
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

function readStore(): Store {
  return readJson<Store>(STORAGE_MIGRATION_KEY, {});
}

export function getStorageMigrationRecord(userId: string): StorageMigrationRecord {
  return readStore()[userId] ?? emptyRecord(userId);
}

function saveStorageMigrationRecord(record: StorageMigrationRecord) {
  try {
    const store = readStore();
    store[record.userId] = record;
    window.localStorage.setItem(STORAGE_MIGRATION_KEY, JSON.stringify(store));
  } catch {
    /* 儲存空間不可用時忽略，下次登入會再嘗試 */
  }
}

/* --------------------------- 既有對照與本機資料 --------------------------- */

type MappingRecord = { map?: Record<string, string> };

function mappingFor(key: string, userId: string): Record<string, string> {
  const store = readJson<Record<string, MappingRecord>>(key, {});
  return store[userId]?.map ?? {};
}

type LocalPhotoItem = { id: string; photo?: string; image?: string };

function localPhotos(key: string, field: "photo" | "image"): Array<{ id: string; value: string }> {
  const list = readJson<LocalPhotoItem[]>(key, []);
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => ({ id: item?.id, value: (item?.[field] as string | undefined) ?? "" }))
    .filter((item): item is { id: string; value: string } => Boolean(item.id && item.value));
}

/* ------------------------------ 單張圖片搬移 ------------------------------ */

type TableName = "idols" | "memories" | "sugar_items";

async function migrateOne(params: {
  userId: string;
  kind: MediaKind;
  table: TableName;
  column: "photo" | "image";
  cloudId: string;
  localValue: string;
  mappings: Record<string, string>;
  localId: string;
  warnings: string[];
  label: string;
}): Promise<boolean> {
  const { userId, kind, table, column, cloudId, localValue, mappings, localId, warnings, label } =
    params;

  // 1. 已有 migration mapping
  if (isStorageRef(mappings[localId])) return true;

  // 2. 雲端資料已經是 Storage reference
  const { data: row, error: readError } = await supabase
    .from(table)
    .select(`id, ${column}`)
    .eq("id", cloudId)
    .maybeSingle();
  if (readError) {
    warnings.push(`${label} 讀取雲端資料失敗，已保留原本的照片`);
    return false;
  }
  if (!row) {
    warnings.push(`${label} 找不到對應的雲端資料，已保留在本機`);
    return false;
  }
  const current = ((row as Record<string, unknown>)[column] as string | null) ?? "";
  if (isStorageRef(current)) {
    mappings[localId] = current;
    return true;
  }

  // 3. Storage 已經有這筆資料的圖片
  let ref = await findExistingImage(userId, kind, cloudId);

  // 4. 最後才上傳
  if (!ref) {
    if (!isDataUrl(localValue)) {
      warnings.push(`${label} 的照片格式無法解析，已保留原本的照片`);
      return false;
    }
    try {
      ref = await uploadImage(userId, kind, cloudId, localValue);
    } catch {
      warnings.push(`${label} 的照片上傳失敗，已保留原本的照片`);
      return false;
    }
    if (!ref) {
      warnings.push(`${label} 的照片格式無法解析，已保留原本的照片`);
      return false;
    }
  }

  const { error: updateError } = await supabase
    .from(table)
    .update({ [column]: ref })
    .eq("id", cloudId);
  if (updateError) {
    warnings.push(`${label} 的照片寫入雲端失敗，已保留原本的照片`);
    return false;
  }

  mappings[localId] = ref;
  return true;
}

/* -------------------------------- 主流程 -------------------------------- */

export async function migrateLocalImages(userId: string): Promise<StorageMigrationRecord> {
  const previous = getStorageMigrationRecord(userId);
  const record: StorageMigrationRecord = {
    ...emptyRecord(userId),
    startedAt: previous.startedAt || new Date().toISOString(),
    idolMappings: { ...previous.idolMappings },
    memoryMappings: { ...previous.memoryMappings },
    sugarMappings: { ...previous.sugarMappings },
  };
  const warnings: string[] = [];

  const idolMap = mappingFor("idoldays.cloudMigration.idols.v1", userId);
  const memoryMap = mappingFor("idoldays.cloudMigration.memories.v1", userId);
  const sugarMap = mappingFor("idoldays.cloudMigration.sugar.v1", userId);

  const jobs: Array<{
    kind: MediaKind;
    table: TableName;
    column: "photo" | "image";
    items: Array<{ id: string; value: string }>;
    map: Record<string, string>;
    mappings: Record<string, string>;
    label: string;
  }> = [
    {
      kind: "idols",
      table: "idols",
      column: "photo",
      items: localPhotos("idoldays.idols.v1", "photo"),
      map: idolMap,
      mappings: record.idolMappings,
      label: "偶像照片",
    },
    {
      kind: "memories",
      table: "memories",
      column: "photo",
      items: localPhotos("idoldays.memories.v1", "photo"),
      map: memoryMap,
      mappings: record.memoryMappings,
      label: "回憶照片",
    },
    {
      kind: "sugar",
      table: "sugar_items",
      column: "image",
      items: localPhotos("idoldays.heart.v1", "image"),
      map: sugarMap,
      mappings: record.sugarMappings,
      label: "嗑糖照片",
    },
  ];

  let allOk = true;
  for (const job of jobs) {
    for (const item of job.items) {
      const cloudId = job.map[item.id];
      if (!cloudId) {
        warnings.push(`${job.label} 尚未有對應的雲端資料，已保留在本機`);
        allOk = false;
        continue;
      }
      const ok = await migrateOne({
        userId,
        kind: job.kind,
        table: job.table,
        column: job.column,
        cloudId,
        localValue: item.value,
        mappings: job.mappings,
        localId: item.id,
        warnings,
        label: job.label,
      });
      if (!ok) allOk = false;
    }
  }

  record.warnings = warnings;
  record.failed = !allOk;
  record.completed = allOk;
  record.completedAt = allOk ? new Date().toISOString() : null;
  saveStorageMigrationRecord(record);
  return record;
}

/** 同一帳號同一時間只會有一個 Storage migration 在跑（避免同一張圖上傳兩次） */
const inflight = new Map<string, Promise<StorageMigrationRecord>>();

export function ensureStorageMigration(userId: string): Promise<StorageMigrationRecord> {
  const running = inflight.get(userId);
  if (running) return running;

  const existing = getStorageMigrationRecord(userId);
  if (existing.completed) return Promise.resolve(existing);

  const task = migrateLocalImages(userId).finally(() => inflight.delete(userId));
  inflight.set(userId, task);
  return task;
}
