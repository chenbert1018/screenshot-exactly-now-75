import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import { MAX_IDOLS, useIdols, type Idol, type IdolDraft } from "./idols";
import {
  createCloudIdol,
  deleteCloudIdol,
  listCloudIdols,
  updateCloudIdol,
} from "./idols.cloud";

/**
 * Idol 資料來源切換層。
 *
 * 未登入 → localStorage（idoldays.idols.v1，行為完全不變）
 * 已登入 → Supabase idols（第一次登入時把本機偶像一次性複製到雲端，不刪除本機資料）
 *
 * 這個檔案只負責「資料來源接線」，不改動 Idol 資料模型與任何畫面邏輯。
 */

/* ------------------------- migration metadata ------------------------- */

const MIGRATION_KEY = "idoldays.cloudMigration.idols.v1";

type MigrationRecord = {
  /** 這個 user 是否已完成一次性 migration */
  done: boolean;
  /** localId → cloudId 對照，讓既有本機資料（events 等）仍能找到對應偶像 */
  map: Record<string, string>;
  migratedAt?: string;
};

type MigrationStore = Record<string, MigrationRecord>;

function readStore(): MigrationStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(MIGRATION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as MigrationStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: MigrationStore) {
  try {
    window.localStorage.setItem(MIGRATION_KEY, JSON.stringify(store));
  } catch {
    /* 儲存空間不可用時忽略，下次登入會再嘗試 */
  }
}

export function getMigrationRecord(userId: string): MigrationRecord {
  return readStore()[userId] ?? { done: false, map: {} };
}

function saveMigrationRecord(userId: string, record: MigrationRecord) {
  const store = readStore();
  store[userId] = record;
  writeStore(store);
}

function readLocalIdols(): Idol[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("idoldays.idols.v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Idol[]) : [];
  } catch {
    return [];
  }
}

function sameIdol(a: Idol, b: Idol) {
  return (
    a.name.trim() === b.name.trim() &&
    a.groupName.trim() === b.groupName.trim() &&
    (a.birthday || "") === (b.birthday || "") &&
    (a.debutDate || "") === (b.debutDate || "")
  );
}

export type MigrationResult = {
  created: number;
  skipped: number;
  /** 因為雲端已滿 5 位而無法搬移的本機偶像名稱 */
  pending: string[];
};

/**
 * 一次性把本機偶像複製到雲端。可安全重跑：
 * - 已有 localId → cloudId 對照的不再建立
 * - 雲端已存在同名同團同生日/出道日的不再建立
 * - 從不刪除或覆蓋任何資料
 */
export async function migrateLocalIdols(userId: string): Promise<MigrationResult> {
  const record = getMigrationRecord(userId);
  const local = readLocalIdols();
  const cloud = await listCloudIdols();

  const result: MigrationResult = { created: 0, skipped: 0, pending: [] };
  const map = { ...record.map };
  const cloudList = [...cloud];

  for (const item of local) {
    const mappedId = map[item.id];
    if (mappedId && cloudList.some((c) => c.id === mappedId)) {
      result.skipped += 1;
      continue;
    }
    const existing = cloudList.find((c) => sameIdol(c, item));
    if (existing) {
      map[item.id] = existing.id;
      result.skipped += 1;
      continue;
    }
    if (cloudList.length >= MAX_IDOLS) {
      result.pending.push(item.name);
      continue;
    }
    const { id: _localId, ...draft } = item;
    const created = await createCloudIdol(draft as IdolDraft, userId);
    cloudList.push(created);
    map[item.id] = created.id;
    result.created += 1;
  }

  saveMigrationRecord(userId, {
    done: result.pending.length === 0,
    map,
    migratedAt: new Date().toISOString(),
  });

  return result;
}

/* ------------------------- migration orchestration ------------------------- */

/** 同一次瀏覽中避免多處同時搬移（會造成重複偶像） */
const inflight = new Map<string, Promise<Record<string, string>>>();

/** 確保偶像 migration 完成，回傳 local idol id → cloud idol id 對照；同時只會執行一次 */
export function ensureIdolMigration(userId: string): Promise<Record<string, string>> {
  const running = inflight.get(userId);
  if (running) return running;
  const task = (async () => {
    if (!getMigrationRecord(userId).done) await migrateLocalIdols(userId);
    return getMigrationRecord(userId).map;
  })().finally(() => inflight.delete(userId));
  inflight.set(userId, task);
  return task;
}

/* --------------------------- data source hook --------------------------- */

export type IdolSource = {
  idols: Idol[];
  ready: boolean;
  mode: "local" | "cloud";
  error: string | null;
  /** 依 id 找偶像；已登入時同時支援搬移前的本機 id */
  findIdol: (id: string | undefined) => Idol | undefined;
  /** 本命：雲端使用 profile.main_idol_id，其次為第一位 */
  mainIdol: Idol | undefined;
  addIdol: (draft: IdolDraft) => Promise<void>;
  updateIdol: (id: string, draft: IdolDraft) => Promise<void>;
  removeIdol: (id: string) => Promise<void>;
  reload: () => void;
};

export function useIdolSource(): IdolSource {
  const { user, loading: authLoading } = useAuth();
  const local = useIdols();

  const [cloudIdols, setCloudIdols] = useState<Idol[]>([]);
  const [cloudReady, setCloudReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mainIdolId, setMainIdolId] = useState<string | null>(null);
  const [aliasMap, setAliasMap] = useState<Record<string, string>>({});
  const [tick, setTick] = useState(0);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setCloudIdols([]);
      setCloudReady(false);
      setError(null);
      setMainIdolId(null);
      setAliasMap({});
      return;
    }

    let active = true;
    (async () => {
      try {
        // 先完成一次性 migration，再切換到雲端資料
        const map = await ensureIdolMigration(userId);
        if (!active) return;
        setAliasMap(map);

        const list = await listCloudIdols();
        if (!active) return;
        setCloudIdols(list);

        const { data } = await supabase
          .from("profiles")
          .select("main_idol_id")
          .eq("user_id", userId)
          .maybeSingle();
        if (!active) return;
        setMainIdolId(data?.main_idol_id ?? null);

        setError(null);
        setCloudReady(true);
      } catch (e) {
        if (!active) return;
        // 雲端讀取失敗時不清空任何資料，只顯示錯誤狀態
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
  const idols = isCloud ? cloudIdols : local.idols;
  const ready = isCloud ? cloudReady : local.ready && !authLoading;

  const findIdol = useCallback(
    (id: string | undefined) => {
      if (!id) return undefined;
      const direct = idols.find((i) => i.id === id);
      if (direct) return direct;
      const mapped = aliasMap[id];
      return mapped ? idols.find((i) => i.id === mapped) : undefined;
    },
    [idols, aliasMap],
  );

  const mainIdol = isCloud
    ? (idols.find((i) => i.id === mainIdolId) ?? idols[0])
    : idols[0];

  const addIdol = useCallback(
    async (draft: IdolDraft) => {
      if (isCloud && userId) {
        await createCloudIdol(draft, userId);
        reload();
        return;
      }
      local.addIdol(draft);
    },
    [isCloud, userId, local, reload],
  );

  const updateIdolFn = useCallback(
    async (id: string, draft: IdolDraft) => {
      if (isCloud) {
        await updateCloudIdol(id, draft);
        reload();
        return;
      }
      local.updateIdol(id, draft);
    },
    [isCloud, local, reload],
  );

  const removeIdol = useCallback(
    async (id: string) => {
      if (isCloud) {
        await deleteCloudIdol(id);
        reload();
        return;
      }
      local.removeIdol(id);
    },
    [isCloud, local, reload],
  );

  return {
    idols,
    ready,
    mode: isCloud ? "cloud" : "local",
    error,
    findIdol,
    mainIdol,
    addIdol,
    updateIdol: updateIdolFn,
    removeIdol,
    reload,
  };
}
