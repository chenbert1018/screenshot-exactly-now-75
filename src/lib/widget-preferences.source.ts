import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth";
import {
  getDefaultWidgetPreferences,
  loadWidgetPreferences,
  updateWidgetPreferences as updateLocalWidgetPreferences,
  type WidgetPreferences,
} from "./widget";
import {
  createWidgetPreferences,
  getWidgetPreferences,
  updateWidgetPreferences as updateCloudWidgetPreferences,
} from "./widget-preferences.cloud";
import { ensureEventMigration } from "./events.source";

/**
 * Widget 設定資料來源切換層。
 *
 * 未登入 → localStorage（idoldays.widget.preferences.v1）
 * 已登入 → Supabase widget_preferences（每位使用者一筆）
 *
 * 只切換資料來源，Widget V2 內容引擎（每日一句／裝飾／心情／倒數）完全未改。
 */

export const WIDGET_PREFS_MIGRATION_KEY = "idoldays.cloudMigration.widgetPreferences.v1";

export type WidgetPrefsMigrationRecord = {
  version: 1;
  userId: string;
  done: boolean;
  warnings: string[];
  migratedAt?: string;
};

type Store = Record<string, WidgetPrefsMigrationRecord>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(WIDGET_PREFS_MIGRATION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  try {
    window.localStorage.setItem(WIDGET_PREFS_MIGRATION_KEY, JSON.stringify(store));
  } catch {
    /* 忽略儲存空間問題 */
  }
}

export function getWidgetPrefsMigrationRecord(userId: string): WidgetPrefsMigrationRecord {
  return readStore()[userId] ?? { version: 1, userId, done: false, warnings: [] };
}

function saveWidgetPrefsMigrationRecord(record: WidgetPrefsMigrationRecord) {
  const store = readStore();
  store[record.userId] = record;
  writeStore(store);
}

/** 一次性把本機 Widget 設定複製到雲端；雲端已有設定時不覆蓋 */
export async function migrateLocalWidgetPreferences(
  userId: string,
  idolMap: Record<string, string>,
): Promise<{ created: boolean; warnings: string[] }> {
  const warnings: string[] = [];
  const existing = await getWidgetPreferences();
  if (existing) {
    saveWidgetPrefsMigrationRecord({
      version: 1,
      userId,
      done: true,
      warnings,
      migratedAt: new Date().toISOString(),
    });
    return { created: false, warnings };
  }

  const localPrefs = loadWidgetPreferences();
  let cloudIdolId: string | undefined;
  if (localPrefs.idolId) {
    const mapped = idolMap[localPrefs.idolId];
    if (mapped) cloudIdolId = mapped;
    else if (Object.values(idolMap).includes(localPrefs.idolId)) cloudIdolId = localPrefs.idolId;
    else warnings.push("小工具設定找不到對應的雲端偶像，已改為未指定");
  }

  try {
    await createWidgetPreferences(
      {
        enabledContents: localPrefs.enabledContents,
        ...(cloudIdolId ? { idolId: cloudIdolId } : {}),
      },
      userId,
    );
  } catch {
    warnings.push("小工具設定搬移失敗，已保留在本機");
    saveWidgetPrefsMigrationRecord({ version: 1, userId, done: false, warnings });
    return { created: false, warnings };
  }

  saveWidgetPrefsMigrationRecord({
    version: 1,
    userId,
    done: warnings.length === 0,
    warnings,
    migratedAt: new Date().toISOString(),
  });
  return { created: true, warnings };
}

const inflight = new Map<string, Promise<void>>();

export function ensureWidgetPrefsMigration(userId: string) {
  const running = inflight.get(userId);
  if (running) return running;
  const task = (async () => {
    const { idolMap } = await ensureEventMigration(userId);
    if (!getWidgetPrefsMigrationRecord(userId).done) {
      await migrateLocalWidgetPreferences(userId, idolMap);
    }
  })().finally(() => inflight.delete(userId));
  inflight.set(userId, task);
  return task;
}

/* --------------------------- data source hook --------------------------- */

export type WidgetPreferenceSource = {
  prefs: WidgetPreferences | null;
  ready: boolean;
  mode: "local" | "cloud";
  error: string | null;
  update: (patch: Partial<WidgetPreferences>) => Promise<void>;
  reload: () => void;
};

export function useWidgetPreferenceSource(): WidgetPreferenceSource {
  const { user, loading: authLoading } = useAuth();

  const [localPrefs, setLocalPrefs] = useState<WidgetPreferences | null>(null);
  const [cloudPrefs, setCloudPrefs] = useState<WidgetPreferences | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const userId = user?.id ?? null;

  useEffect(() => {
    setLocalPrefs(loadWidgetPreferences());
  }, []);

  useEffect(() => {
    if (!userId) {
      setCloudPrefs(null);
      setCloudReady(false);
      setError(null);
      return;
    }

    let active = true;
    (async () => {
      try {
        await ensureWidgetPrefsMigration(userId);
        const remote = await getWidgetPreferences();
        if (!active) return;
        setCloudPrefs(remote ?? getDefaultWidgetPreferences());
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

  const update = useCallback(
    async (patch: Partial<WidgetPreferences>) => {
      if (!isCloud || !userId) {
        setLocalPrefs(updateLocalWidgetPreferences(patch));
        return;
      }
      const next = await updateCloudWidgetPreferences(patch, userId);
      setCloudPrefs(next);
    },
    [isCloud, userId],
  );

  return {
    prefs: isCloud ? (cloudReady ? cloudPrefs : null) : localPrefs,
    ready: isCloud ? cloudReady : localPrefs !== null && !authLoading,
    mode: isCloud ? "cloud" : "local",
    error,
    update,
    reload,
  };
}
