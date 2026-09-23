import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth";
import {
  loadArchaeologyItems,
  sortArchaeologyItems,
  useArchaeology,
  type ArchaeologyDraft,
  type ArchaeologyItem,
} from "./archaeology";
import {
  createCloudArchaeology,
  deleteCloudArchaeology,
  listCloudArchaeology,
  setCloudArchaeologyFavorite,
  updateCloudArchaeology,
  updateCloudArchaeologyImage,
} from "./archaeology.cloud";
import { ensureIdolMigration } from "./idols.source";
import { isDataUrl, removeImage, uploadImage } from "./storage";

const MIGRATION_KEY = "idoldays.cloudMigration.archaeology.v1";

type MigrationStore = Record<
  string,
  { done: boolean; map: Record<string, string>; warnings: string[] }
>;

function readMigrationStore(): MigrationStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(MIGRATION_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeMigration(
  userId: string,
  value: MigrationStore[string],
) {
  try {
    const store = readMigrationStore();
    window.localStorage.setItem(
      MIGRATION_KEY,
      JSON.stringify({ ...store, [userId]: value }),
    );
  } catch {
    /* Migration metadata failure must not delete local data. */
  }
}

async function cleanupArchaeologyImage(ref?: string) {
  if (!ref || isDataUrl(ref)) return;
  try { await removeImage(ref); } catch {}
}

async function storeCover(
  userId: string,
  cloudId: string,
  imageUrl?: string,
) {
  if (!imageUrl || !isDataUrl(imageUrl)) return;
  try {
    const ref = await uploadImage(
      userId,
      "archaeology",
      cloudId,
      imageUrl,
    );
    if (ref) await updateCloudArchaeologyImage(cloudId, ref);
  } catch {
    /* Keep the original local image when upload is unavailable. */
  }
}

async function ensureArchaeologyMigration(userId: string) {
  const record = readMigrationStore()[userId] ?? {
    done: false,
    map: {},
    warnings: [],
  };
  if (record.done) return;

  const idolMap = await ensureIdolMigration(userId);
  const local = loadArchaeologyItems();
  const cloud = [...(await listCloudArchaeology())];
  const map = { ...record.map };
  const warnings: string[] = [];

  for (const item of local) {
    if (map[item.id] && cloud.some((entry) => entry.id === map[item.id])) {
      continue;
    }

    const existing = cloud.find(
      (entry) => entry.url === item.url && entry.title === item.title,
    );
    if (existing) {
      map[item.id] = existing.id;
      continue;
    }

    const mappedIdolId = item.idolId
      ? idolMap[item.idolId] ??
        (Object.values(idolMap).includes(item.idolId)
          ? item.idolId
          : undefined)
      : undefined;

    try {
      const created = await createCloudArchaeology(
        {
          url: item.url,
          title: item.title,
          imageUrl: item.imageUrl,
          idolId: mappedIdolId,
          collection: item.collection,
          tags: item.tags,
          note: item.note,
        },
        userId,
        item.favorite,
      );
      await storeCover(userId, created.id, item.imageUrl);
      cloud.push(created);
      map[item.id] = created.id;
    } catch {
      warnings.push(`「${item.title}」搬移失敗，仍保留在本機`);
    }
  }

  writeMigration(userId, {
    done: warnings.length === 0,
    map,
    warnings,
  });
}

export function useArchaeologySource() {
  const { user, loading: authLoading } = useAuth();
  const local = useArchaeology();
  const [cloudItems, setCloudItems] = useState<ArchaeologyItem[]>([]);
  const [cloudReady, setCloudReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const userId = user?.id ?? null;
  const reload = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    if (!userId) {
      setCloudItems([]);
      setCloudReady(false);
      setError(null);
      return;
    }
    let active = true;
    void (async () => {
      try {
        await ensureArchaeologyMigration(userId);
        const list = await listCloudArchaeology();
        if (!active) return;
        setCloudItems(list);
        setError(null);
      } catch (reason) {
        if (!active) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "考古雲端資料讀取失敗",
        );
      } finally {
        if (active) setCloudReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId, tick]);

  const isCloud = Boolean(userId);

  const addItem = useCallback(
    async (draft: ArchaeologyDraft) => {
      if (!isCloud || !userId) {
        return local.addItem(draft);
      }
      const created = await createCloudArchaeology(draft, userId);
      await storeCover(userId, created.id, draft.imageUrl);
      reload();
      return created;
    },
    [isCloud, userId, local, reload],
  );

  const updateItem = useCallback(
    async (id: string, draft: ArchaeologyDraft) => {
      if (!isCloud || !userId) {
        local.updateItem(id, draft);
        return;
      }
      const previous = cloudItems.find((item) => item.id === id);
      await updateCloudArchaeology(id, draft);
      await storeCover(userId, id, draft.imageUrl);
      if (previous?.imageUrl && previous.imageUrl !== draft.imageUrl) await cleanupArchaeologyImage(previous.imageUrl);
      reload();
    },
    [isCloud, userId, local, reload],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      if (!isCloud) {
        local.toggleFavorite(id);
        return;
      }
      const item = cloudItems.find((entry) => entry.id === id);
      if (!item) return;
      setCloudItems((items) =>
        items.map((entry) =>
          entry.id === id
            ? { ...entry, favorite: !entry.favorite }
            : entry,
        ),
      );
      await setCloudArchaeologyFavorite(id, !item.favorite);
    },
    [isCloud, local, cloudItems],
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (!isCloud) {
        local.removeItem(id);
        return;
      }
      const item = cloudItems.find((entry) => entry.id === id);
      await deleteCloudArchaeology(id);
      await cleanupArchaeologyImage(item?.imageUrl);
      setCloudItems((items) => items.filter((entry) => entry.id !== id));
    },
    [isCloud, local, cloudItems],
  );

  return {
    items: isCloud
      ? sortArchaeologyItems(cloudItems)
      : local.items,
    ready: isCloud ? cloudReady : local.ready && !authLoading,
    mode: isCloud ? ("cloud" as const) : ("local" as const),
    error,
    addItem,
    updateItem,
    toggleFavorite,
    removeItem,
    reload,
  };
}
