import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "idoldays.milestones.v1";

export const MILESTONE_EMOJIS = ["🎫", "✈️", "🏨", "🎤", "🎁", "📸", "💗", "✨", "♡"] as const;

export type Milestone = {
  id: string;
  eventId: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  emoji: string;
  completed: boolean;
  createdAt: number;
};

export type MilestoneDraft = Pick<Milestone, "title" | "date" | "emoji">;

export const emptyMilestoneDraft: MilestoneDraft = { title: "", date: "", emoji: "🎫" };

function read(): Milestone[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Milestone[]) : [];
  } catch {
    return [];
  }
}

function write(list: Milestone[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota or unavailable storage */
  }
}

const listeners = new Set<(list: Milestone[]) => void>();

function emit(list: Milestone[]) {
  write(list);
  listeners.forEach((fn) => fn(list));
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `milestone_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function sortMilestones(list: Milestone[]) {
  return [...list].sort((a, b) =>
    a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1,
  );
}

export function getMilestones(eventId: string) {
  return sortMilestones(read().filter((m) => m.eventId === eventId));
}

/** Event 被刪除時一併清理，避免 orphan data */
export function deleteMilestonesForEvent(eventId: string) {
  emit(read().filter((m) => m.eventId !== eventId));
}

export function useMilestones(eventId?: string) {
  const [all, setAll] = useState<Milestone[]>([]);

  useEffect(() => {
    setAll(read());
    const fn = (list: Milestone[]) => setAll(list);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const milestones = eventId ? sortMilestones(all.filter((m) => m.eventId === eventId)) : [];

  const addMilestone = useCallback((id: string, draft: MilestoneDraft) => {
    emit([
      ...read(),
      { ...draft, id: newId(), eventId: id, completed: false, createdAt: Date.now() },
    ]);
  }, []);

  const updateMilestone = useCallback((id: string, draft: MilestoneDraft) => {
    emit(read().map((m) => (m.id === id ? { ...m, ...draft } : m)));
  }, []);

  const toggleMilestone = useCallback((id: string) => {
    emit(read().map((m) => (m.id === id ? { ...m, completed: !m.completed } : m)));
  }, []);

  const removeMilestone = useCallback((id: string) => {
    emit(read().filter((m) => m.id !== id));
  }, []);

  return { milestones, addMilestone, updateMilestone, toggleMilestone, removeMilestone };
}
