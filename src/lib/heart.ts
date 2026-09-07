import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "idoldays.heart.v1";

export type HeartItemType = "PHOTO" | "MOMENT" | "STAGE" | "SWEET" | "CUSTOM";

export const HEART_TYPES: { value: HeartItemType; label: string; emoji: string }[] = [
  { value: "PHOTO", label: "照片", emoji: "📷" },
  { value: "MOMENT", label: "名場面", emoji: "✦" },
  { value: "STAGE", label: "舞台", emoji: "🎤" },
  { value: "SWEET", label: "撒糖", emoji: "🍬" },
  { value: "CUSTOM", label: "其他", emoji: "♡" },
];

export function heartTypeLabel(type: HeartItemType) {
  return HEART_TYPES.find((t) => t.value === type)?.label ?? "其他";
}

export type HeartItem = {
  id: string;
  idolId: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  type: HeartItemType;
  note?: string;
  image?: string;
  link?: string;
  createdAt: string;
};

export type HeartDraft = {
  idolId: string;
  title: string;
  date: string;
  type: HeartItemType;
  note: string;
  image: string;
  link: string;
};

export const emptyHeartDraft: HeartDraft = {
  idolId: "",
  title: "",
  date: "",
  type: "MOMENT",
  note: "",
  image: "",
  link: "",
};

export function loadHeartItems(): HeartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is HeartItem => !!i && typeof i === "object" && typeof i.id === "string",
    );
  } catch {
    return [];
  }
}

export function saveHeartItems(list: HeartItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota or unavailable storage */
  }
}

const listeners = new Set<(list: HeartItem[]) => void>();

function emit(list: HeartItem[]) {
  saveHeartItems(list);
  listeners.forEach((fn) => fn(list));
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `heart_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** date 新 → 舊，同日 createdAt 新 → 舊 */
export function sortHeartItems(list: HeartItem[]) {
  return [...list].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  });
}

export function getHeartItemsByIdol(idolId?: string) {
  const all = loadHeartItems();
  return sortHeartItems(idolId ? all.filter((i) => i.idolId === idolId) : all);
}

export function addHeartItem(draft: HeartDraft) {
  const item: HeartItem = {
    id: newId(),
    idolId: draft.idolId,
    title: draft.title.trim(),
    date: draft.date,
    type: draft.type,
    createdAt: new Date().toISOString(),
    ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
    ...(draft.image ? { image: draft.image } : {}),
    ...(draft.link.trim() ? { link: draft.link.trim() } : {}),
  };
  emit([...loadHeartItems(), item]);
  return item;
}

export function updateHeartItem(id: string, draft: HeartDraft) {
  emit(
    loadHeartItems().map((i): HeartItem =>
      i.id === id
        ? {
            id: i.id,
            createdAt: i.createdAt,
            idolId: draft.idolId,
            title: draft.title.trim(),
            date: draft.date,
            type: draft.type,
            ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
            ...(draft.image ? { image: draft.image } : {}),
            ...(draft.link.trim() ? { link: draft.link.trim() } : {}),
          }
        : i,
    ),
  );

}

export function deleteHeartItem(id: string) {
  emit(loadHeartItems().filter((i) => i.id !== id));
}

export function useHeartItems() {
  const [items, setItems] = useState<HeartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(loadHeartItems());
    setReady(true);
    const fn = (list: HeartItem[]) => setItems(list);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  return {
    items: sortHeartItems(items),
    ready,
    add: useCallback((d: HeartDraft) => addHeartItem(d), []),
    update: useCallback((id: string, d: HeartDraft) => updateHeartItem(id, d), []),
    remove: useCallback((id: string) => deleteHeartItem(id), []),
  };
}

const WHISPERS = [
  "有些糖，過了很久重新看到，還是會甜。",
  "這一幕，值得再嗑一次。",
  "今天也偷偷喜歡了一下。",
  "有些瞬間，看幾次都不會膩。",
  "這顆糖，先收藏起來。",
] as const;

/** 同一天固定同一則小語 */
export function heartWhisper(base: Date = new Date()) {
  const seed = base.getFullYear() * 10000 + (base.getMonth() + 1) * 100 + base.getDate();
  return WHISPERS[seed % WHISPERS.length];
}
