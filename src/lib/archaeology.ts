import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "idoldays.archaeology.v1";

export type ArchaeologySource =
  | "THREADS"
  | "X"
  | "YOUTUBE"
  | "TIKTOK"
  | "INSTAGRAM"
  | "WEB";

export type ArchaeologyItem = {
  id: string;
  url: string;
  title: string;
  imageUrl?: string | undefined;
  source: ArchaeologySource;
  idolId?: string | undefined;
  collection: string;
  tags: string[];
  note: string;
  favorite: boolean;
  createdAt: string;
};

export type ArchaeologyDraft = {
  url: string;
  title: string;
  imageUrl?: string | undefined;
  idolId?: string | undefined;
  collection: string;
  tags: string[];
  note: string;
};

export const emptyArchaeologyDraft: ArchaeologyDraft = {
  url: "",
  title: "",
  imageUrl: "",
  collection: "",
  tags: [],
  note: "",
};

function makeId() {
  return `archaeology_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function detectArchaeologySource(
  url: string,
): ArchaeologySource {
  const value = url.trim().toLowerCase();

  if (
    value.includes("threads.net") ||
    value.includes("threads.com")
  ) {
    return "THREADS";
  }

  if (
    value.includes("twitter.com") ||
    value.includes("x.com")
  ) {
    return "X";
  }

  if (
    value.includes("youtube.com") ||
    value.includes("youtu.be")
  ) {
    return "YOUTUBE";
  }

  if (value.includes("tiktok.com")) {
    return "TIKTOK";
  }

  if (value.includes("instagram.com")) {
    return "INSTAGRAM";
  }

  return "WEB";
}

function normalize(raw: unknown): ArchaeologyItem | null {
  if (!raw || typeof raw !== "object") return null;

  const item = raw as Partial<ArchaeologyItem>;

  if (
    typeof item.id !== "string" ||
    typeof item.url !== "string" ||
    typeof item.title !== "string"
  ) {
    return null;
  }

  return {
    id: item.id,
    url: item.url,
    title: item.title,
    imageUrl:
      typeof item.imageUrl === "string" && item.imageUrl.trim()
        ? item.imageUrl
        : undefined,
    source:
      typeof item.source === "string"
        ? item.source as ArchaeologySource
        : detectArchaeologySource(item.url),
    idolId:
      typeof item.idolId === "string"
        ? item.idolId
        : undefined,
    collection:
      typeof item.collection === "string"
        ? item.collection
        : "",
    tags: Array.isArray(item.tags)
      ? item.tags.filter(
          (tag): tag is string => typeof tag === "string",
        )
      : [],
    note: typeof item.note === "string" ? item.note : "",
    favorite: Boolean(item.favorite),
    createdAt:
      typeof item.createdAt === "string"
        ? item.createdAt
        : new Date().toISOString(),
  };
}

export function loadArchaeologyItems(): ArchaeologyItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalize)
      .filter(
        (item): item is ArchaeologyItem => item !== null,
      );
  } catch {
    return [];
  }
}

function write(items: ArchaeologyItem[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items),
    );
  } catch {
    // Storage unavailable: keep current in-memory state.
  }
}

const listeners = new Set<
  (items: ArchaeologyItem[]) => void
>();

function emit(items: ArchaeologyItem[]) {
  write(items);

  for (const listener of listeners) {
    listener(items);
  }
}

export function sortArchaeologyItems(
  items: ArchaeologyItem[],
) {
  return [...items].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function useArchaeology() {
  const [items, setItems] = useState<ArchaeologyItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(sortArchaeologyItems(loadArchaeologyItems()));
    setReady(true);

    const listener = (next: ArchaeologyItem[]) => {
      setItems(sortArchaeologyItems(next));
    };

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const addItem = useCallback(
    (draft: ArchaeologyDraft) => {
      const item: ArchaeologyItem = {
        id: makeId(),
        url: draft.url.trim(),
        title: draft.title.trim(),
        imageUrl: draft.imageUrl?.trim() || undefined,
        source: detectArchaeologySource(draft.url),
        idolId: draft.idolId,
        collection: draft.collection.trim(),
        tags: draft.tags
          .map((tag) => tag.trim())
          .filter(Boolean),
        note: draft.note.trim(),
        favorite: false,
        createdAt: new Date().toISOString(),
      };

      emit([item, ...loadArchaeologyItems()]);
      return item;
    },
    [],
  );

  const updateItem = useCallback(
    (id: string, draft: ArchaeologyDraft) => {
      const next = loadArchaeologyItems().map((item) =>
        item.id === id
          ? {
              ...item,
              url: draft.url.trim(),
              title: draft.title.trim(),
              imageUrl: draft.imageUrl?.trim() || undefined,
              source: detectArchaeologySource(draft.url),
              idolId: draft.idolId,
              collection: draft.collection.trim(),
              tags: draft.tags
                .map((tag) => tag.trim())
                .filter(Boolean),
              note: draft.note.trim(),
            }
          : item,
      );

      emit(next);
    },
    [],
  );

  const toggleFavorite = useCallback((id: string) => {
    emit(
      loadArchaeologyItems().map((item) =>
        item.id === id
          ? { ...item, favorite: !item.favorite }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    emit(loadArchaeologyItems().filter((item) => item.id !== id));
  }, []);

  return {
    items,
    ready,
    addItem,
    updateItem,
    toggleFavorite,
    removeItem,
  };
}
