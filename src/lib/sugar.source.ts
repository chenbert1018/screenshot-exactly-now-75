import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth";
import {
  loadHeartItems,
  sortHeartItems,
  useHeartItems,
  type HeartDraft,
  type HeartItem,
} from "./heart";
import {
  createSugarItem,
  deleteSugarItem,
  listSugarItems,
  updateSugarItem,
  type SugarItemInput,
} from "./sugar.cloud";
import { ensureEventMigration } from "./events.source";

/**
 * 「嗑糖」資料來源切換層（技術名稱維持 heart / sugar_items）。
 *
 * 未登入 → localStorage（idoldays.heart.v1，行為完全不變）
 * 已登入 → Supabase sugar_items（第一次登入一次性複製，不刪除本機資料）
 *
 * 雲端欄位維持 image（不是 photo）；本階段完全不處理圖片 Storage。
 */

export const SUGAR_MIGRATION_KEY = "idoldays.cloudMigration.sugar.v1";

export type SugarMigrationRecord = {
  version: 1;
  userId: string;
  /** local sugar id → cloud sugar id */
  map: Record<string, string>;
  done: boolean;
  warnings: string[];
  migratedAt?: string;
};

type Store = Record<string, SugarMigrationRecord>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SUGAR_MIGRATION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  try {
    window.localStorage.setItem(SUGAR_MIGRATION_KEY, JSON.stringify(store));
  } catch {
    /* 忽略儲存空間問題 */
  }
}

export function getSugarMigrationRecord(userId: string): SugarMigrationRecord {
  return readStore()[userId] ?? { version: 1, userId, map: {}, done: false, warnings: [] };
}

function saveSugarMigrationRecord(record: SugarMigrationRecord) {
  const store = readStore();
  store[record.userId] = record;
  writeStore(store);
}

function draftToInput(draft: HeartDraft, idolId: string | null): SugarItemInput {
  return {
    idolId,
    title: draft.title.trim(),
    date: draft.date,
    type: draft.type,
    note: draft.note?.trim() ?? "",
    image: draft.image ?? "",
    link: draft.link?.trim() ?? "",
  };
}

export type SugarMigrationResult = {
  created: number;
  skipped: number;
  warnings: string[];
  map: Record<string, string>;
};

/** 一次性把本機收藏複製到雲端，可安全重跑、不覆蓋雲端、不刪本機 */
export async function migrateLocalSugarItems(
  userId: string,
  idolMap: Record<string, string>,
): Promise<SugarMigrationResult> {
  const record = getSugarMigrationRecord(userId);
  const local = loadHeartItems();
  const cloudList = [...(await listSugarItems())];

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

    let cloudIdolId: string | null = null;
    if (item.idolId) {
      const found = idolMap[item.idolId];
      if (found) cloudIdolId = found;
      else if (Object.values(idolMap).includes(item.idolId)) cloudIdolId = item.idolId;
      else warnings.push("有一顆糖找不到對應的雲端偶像，已改為不綁定偶像");
    }

    const existing = cloudList.find(
      (c) =>
        (c.idolId || null) === cloudIdolId &&
        c.title === item.title &&
        c.date === item.date &&
        c.type === item.type &&
        (c.note ?? "") === (item.note ?? "") &&
        (c.link ?? "") === (item.link ?? ""),
    );
    if (existing) {
      map[item.id] = existing.id;
      skipped += 1;
      continue;
    }

    try {
      const createdItem = await createSugarItem(
        {
          idolId: cloudIdolId,
          title: item.title,
          date: item.date,
          type: item.type,
          note: item.note ?? "",
          image: item.image ?? "",
          link: item.link ?? "",
        },
        userId,
      );
      cloudList.push(createdItem);
      map[item.id] = createdItem.id;
      created += 1;
    } catch {
      warnings.push("有一顆糖搬移失敗，已保留在本機");
    }
  }

  saveSugarMigrationRecord({
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

/** 偶像 migration 完成後才搬嗑糖收藏（同時只跑一次，可安全重跑） */
export function ensureSugarMigration(userId: string) {
  const running = inflight.get(userId);
  if (running) return running;
  const task = (async () => {
    const { idolMap } = await ensureEventMigration(userId);
    if (!getSugarMigrationRecord(userId).done) {
      await migrateLocalSugarItems(userId, idolMap);
    }
  })().finally(() => inflight.delete(userId));
  inflight.set(userId, task);
  return task;
}

/* --------------------------- data source hook --------------------------- */

export type SugarSource = {
  items: HeartItem[];
  ready: boolean;
  mode: "local" | "cloud";
  error: string | null;
  add: (draft: HeartDraft) => Promise<void>;
  update: (id: string, draft: HeartDraft) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reload: () => void;
};

export function useSugarSource(): SugarSource {
  const { user, loading: authLoading } = useAuth();
  const local = useHeartItems();

  const [cloudItems, setCloudItems] = useState<HeartItem[]>([]);
  const [cloudReady, setCloudReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setCloudItems([]);
      setCloudReady(false);
      setError(null);
      return;
    }

    let active = true;
    (async () => {
      try {
        await ensureSugarMigration(userId);
        const list = await listSugarItems();
        if (!active) return;
        setCloudItems(list);
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

  const add = useCallback(
    async (draft: HeartDraft) => {
      if (!isCloud || !userId) {
        local.add(draft);
        return;
      }
      await createSugarItem(draftToInput(draft, draft.idolId || null), userId);
      reload();
    },
    [isCloud, userId, local, reload],
  );

  const update = useCallback(
    async (id: string, draft: HeartDraft) => {
      if (!isCloud) {
        local.update(id, draft);
        return;
      }
      await updateSugarItem(id, draftToInput(draft, draft.idolId || null));
      reload();
    },
    [isCloud, local, reload],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!isCloud) {
        local.remove(id);
        return;
      }
      await deleteSugarItem(id);
      reload();
    },
    [isCloud, local, reload],
  );

  return {
    items: isCloud ? sortHeartItems(cloudItems) : local.items,
    ready: isCloud ? cloudReady : local.ready && !authLoading,
    mode: isCloud ? "cloud" : "local",
    error,
    add,
    update,
    remove,
    reload,
  };
}
