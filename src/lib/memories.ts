import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "idoldays.memories.v1";

export type Memory = {
  id: string;
  /** 舊資料可能沒有 folderId，讀取時安全處理 */
  folderId: string;
  idolId?: string | undefined;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  note: string;
  photo?: string | undefined;
  createdAt: string;
};

export type MemoryDraft = {
  title: string;
  date: string;
  note: string;
  photo: string;
};

export const emptyMemoryDraft: MemoryDraft = { title: "", date: "", note: "", photo: "" };

/** 舊資料容錯：缺欄位時補上安全預設值，不刪除任何既有資料 */
function normalize(raw: unknown): Memory | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Partial<Memory>;
  if (typeof m.id !== "string") return null;
  return {
    id: m.id,
    folderId: typeof m.folderId === "string" ? m.folderId : "",
    idolId: typeof m.idolId === "string" ? m.idolId : undefined,
    title: typeof m.title === "string" ? m.title : "",
    date: typeof m.date === "string" ? m.date : "",
    note: typeof m.note === "string" ? m.note : "",
    photo: typeof m.photo === "string" ? m.photo : undefined,
    createdAt: typeof m.createdAt === "string" ? m.createdAt : new Date(0).toISOString(),
  };
}

function read(): Memory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalize).filter((m): m is Memory => m !== null);
  } catch {
    return [];
  }
}

function write(list: Memory[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota or unavailable storage */
  }
}

const listeners = new Set<(list: Memory[]) => void>();

function emit(list: Memory[]) {
  write(list);
  listeners.forEach((fn) => fn(list));
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `memory_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function sortMemories(list: Memory[]) {
  return [...list].sort((a, b) =>
    a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date < b.date ? -1 : 1,
  );
}

/** 依日期分組，供 Timeline 使用 */
export function groupMemoriesByDate(list: Memory[]) {
  const groups: { date: string; items: Memory[] }[] = [];
  for (const m of sortMemories(list)) {
    const last = groups[groups.length - 1];
    if (last && last.date === m.date) last.items.push(m);
    else groups.push({ date: m.date, items: [m] });
  }
  return groups;
}

/** 刪除 Folder 時一併清掉其底下的 Memory，不影響其他 Folder */
export function deleteMemoriesForFolder(folderId: string) {
  emit(read().filter((m) => m.folderId !== folderId));
}

export function useMemories(folderId?: string) {
  const [all, setAll] = useState<Memory[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAll(read());
    setReady(true);
    const fn = (list: Memory[]) => setAll(list);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const memories = folderId ? sortMemories(all.filter((m) => m.folderId === folderId)) : all;

  const addMemory = useCallback((id: string, draft: MemoryDraft, idolId?: string) => {
    const memory: Memory = {
      id: newId(),
      folderId: id,
      idolId: idolId || undefined,
      title: draft.title,
      date: draft.date,
      note: draft.note,
      photo: draft.photo || undefined,
      createdAt: new Date().toISOString(),
    };
    emit([...read(), memory]);
  }, []);

  const updateMemory = useCallback((id: string, draft: MemoryDraft) => {
    emit(
      read().map((m) =>
        m.id === id
          ? { ...m, title: draft.title, date: draft.date, note: draft.note, photo: draft.photo || undefined }
          : m,
      ),
    );
  }, []);

  const removeMemory = useCallback((id: string) => {
    emit(read().filter((m) => m.id !== id));
  }, []);

  return { memories, all, ready, addMemory, updateMemory, removeMemory };
}
