import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "idoldays.memoryFolders.v1";

export type MemoryFolder = {
  id: string;
  idolId?: string;
  title: string;
  description?: string;
  coverPhoto?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
};

export type MemoryFolderDraft = {
  idolId: string;
  title: string;
  description: string;
  coverPhoto: string;
  startDate: string;
  endDate: string;
};

export const emptyFolderDraft: MemoryFolderDraft = {
  idolId: "",
  title: "",
  description: "",
  coverPhoto: "",
  startDate: "",
  endDate: "",
};

function read(): MemoryFolder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as MemoryFolder[]).filter((f) => f && typeof f.id === "string");
  } catch {
    return [];
  }
}

function write(list: MemoryFolder[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota or unavailable storage */
  }
}

const listeners = new Set<(list: MemoryFolder[]) => void>();

function emit(list: MemoryFolder[]) {
  write(list);
  listeners.forEach((fn) => fn(list));
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `folder_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function sortFolders(list: MemoryFolder[]) {
  return [...list].sort((a, b) => {
    const ad = a.startDate ?? "";
    const bd = b.startDate ?? "";
    if (ad !== bd) return ad < bd ? 1 : -1;
    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  });
}

export function useMemoryFolders() {
  const [folders, setFolders] = useState<MemoryFolder[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFolders(read());
    setReady(true);
    const fn = (list: MemoryFolder[]) => setFolders(list);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const addFolder = useCallback((draft: MemoryFolderDraft) => {
    const folder: MemoryFolder = {
      ...draft,
      id: newId(),
      createdAt: new Date().toISOString(),
    };
    emit([...read(), folder]);
    return folder;
  }, []);

  const updateFolder = useCallback((id: string, draft: MemoryFolderDraft) => {
    emit(read().map((f) => (f.id === id ? { ...f, ...draft } : f)));
  }, []);

  const removeFolder = useCallback((id: string) => {
    emit(read().filter((f) => f.id !== id));
  }, []);

  return { folders: sortFolders(folders), ready, addFolder, updateFolder, removeFolder };
}
