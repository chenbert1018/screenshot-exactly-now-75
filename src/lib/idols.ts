import { useCallback, useEffect, useState } from "react";

/** 系統硬上限（IdolDays+ 最多 6 位；免費版另由訂閱狀態限制為 1 位） */
export const MAX_IDOLS = 6;
const STORAGE_KEY = "idoldays.idols.v1";

export type Idol = {
  id: string;
  name: string;
  groupName: string;
  birthday: string;
  debutDate: string;
  fanName: string;
  favoriteColor: string;
  sinceDate: string;
  photo: string;
};

export type IdolDraft = Omit<Idol, "id">;

export const emptyDraft: IdolDraft = {
  name: "",
  groupName: "",
  birthday: "",
  debutDate: "",
  fanName: "",
  favoriteColor: "",
  sinceDate: "",
  photo: "",
};

function read(): Idol[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Idol[]) : [];
  } catch {
    return [];
  }
}

function write(list: Idol[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota or unavailable storage — keep in-memory state only */
  }
}

const listeners = new Set<(list: Idol[]) => void>();

function broadcast(list: Idol[]) {
  listeners.forEach((fn) => fn(list));
}

export function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `idol_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useIdols() {
  const [idols, setIdols] = useState<Idol[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIdols(read());
    setReady(true);
    const fn = (list: Idol[]) => setIdols(list);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const commit = useCallback((list: Idol[]) => {
    write(list);
    broadcast(list);
  }, []);

  const addIdol = useCallback(
    (draft: IdolDraft) => {
      const list = [...read(), { ...draft, id: newId() }].slice(0, MAX_IDOLS);
      commit(list);
    },
    [commit],
  );

  const updateIdol = useCallback(
    (id: string, draft: IdolDraft) => {
      commit(read().map((i) => (i.id === id ? { ...i, ...draft } : i)));
    },
    [commit],
  );

  const removeIdol = useCallback(
    (id: string) => {
      commit(read().filter((i) => i.id !== id));
    },
    [commit],
  );

  return { idols, ready, addIdol, updateIdol, removeIdol };
}
