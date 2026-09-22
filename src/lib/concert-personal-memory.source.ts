import { useCallback, useEffect, useMemo, useState } from "react";
import type { ConcertPersonalMemory, ConcertPersonalMemoryDraft } from "./concert-personal-memory";

const KEY = "idoldays.concertPersonalMemories.v1";

function read(): ConcertPersonalMemory[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: ConcertPersonalMemory[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function useConcertPersonalMemory(eventId?: string) {
  const [entry, setEntry] = useState<ConcertPersonalMemory | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEntry(eventId ? read().find((item) => item.eventId === eventId) ?? null : null);
    setReady(true);
  }, [eventId]);

  const save = useCallback(async (draft: ConcertPersonalMemoryDraft) => {
    if (!eventId) throw new Error("找不到這場演唱會");
    const now = new Date().toISOString();
    const current = read();
    const previous = current.find((item) => item.eventId === eventId);
    const nextEntry: ConcertPersonalMemory = {
      eventId,
      seat: draft.seat.trim() || undefined,
      unforgettableMoment: draft.unforgettableMoment.trim() || undefined,
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
