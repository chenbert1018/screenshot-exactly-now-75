import { useCallback, useEffect, useMemo, useState } from "react";
import type { MeetMemory, MeetMemoryDraft } from "./meet-memory";

const KEY = "idoldays.meetMemories.v1";

function read(): MeetMemory[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: MeetMemory[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function useMeetMemory(eventId?: string) {
  const [entry, setEntry] = useState<MeetMemory | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEntry(eventId ? read().find((item) => item.eventId === eventId) ?? null : null);
    setReady(true);
  }, [eventId]);

  const save = useCallback(async (draft: MeetMemoryDraft) => {
    if (!eventId) throw new Error("找不到這次見面");
    const now = new Date().toISOString();
    const current = read();
    const previous = current.find((item) => item.eventId === eventId);
    const nextEntry: MeetMemory = {
      eventId,
      wantedToSay: draft.wantedToSay.trim() || undefined,
      actuallySaid: draft.actuallySaid.trim() || undefined,
      idolMoment: draft.idolMoment.trim() || undefined,
      afterthought: draft.afterthought.trim() || undefined,
      photo: draft.photo || undefined,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    };
    const next = [nextEntry, ...current.filter((item) => item.eventId !== eventId)];
    write(next);
    setEntry(nextEntry);
    return nextEntry;
  }, [eventId]);

  return useMemo(() => ({ entry, ready, save }), [entry, ready, save]);
}
