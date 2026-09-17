import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import type { ConcertMusicMemory, ConcertMusicMemoryDraft } from "./concert-music-memory";

type MemoryRow = {
  id: string; user_id: string; idol_id: string; event_id: string;
  want_to_hear_song_id: string | null; opening_song_id: string | null; finally_heard_song_id: string | null;
  tearjerker_song_id: string | null; hype_song_id: string | null; unforgettable_song_id: string | null;
  note: string; created_at: string; updated_at: string;
};

const COLUMNS = "id, user_id, idol_id, event_id, want_to_hear_song_id, opening_song_id, finally_heard_song_id, tearjerker_song_id, hype_song_id, unforgettable_song_id, note, created_at, updated_at";

function toMemory(row: MemoryRow): ConcertMusicMemory {
  return {
    id: row.id, userId: row.user_id, idolId: row.idol_id, eventId: row.event_id,
    wantToHearSongId: row.want_to_hear_song_id, openingSongId: row.opening_song_id,
    finallyHeardSongId: row.finally_heard_song_id, tearjerkerSongId: row.tearjerker_song_id,
    hypeSongId: row.hype_song_id, unforgettableSongId: row.unforgettable_song_id,
    note: row.note, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

/** A private concert soundtrack tied to exactly one concert day. */
export function useConcertMusicMemory(event?: { id: string; idolId: string; type: string } | null) {
  const { user, loading: authLoading } = useAuth();
  const [entry, setEntry] = useState<ConcertMusicMemory | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !event || event.type !== "CONCERT") {
      setEntry(null); setError(null); setReady(true); return;
    }
    let active = true;
    setReady(false);
    void supabase.from("concert_music_memories").select(COLUMNS).eq("event_id", event.id).maybeSingle()
      .then(({ data, error: loadError }) => {
        if (!active) return;
        if (loadError) { setEntry(null); setError(loadError.message); }
        else { setEntry(data ? toMemory(data as MemoryRow) : null); setError(null); }
        setReady(true);
      });
    return () => { active = false; };
  }, [authLoading, user?.id, event?.id, event?.type]);

  const save = useCallback(async (draft: ConcertMusicMemoryDraft) => {
    if (!user || !event || event.type !== "CONCERT") throw new Error("請先登入並開啟一個演唱會日子");
    const payload = {
      user_id: user.id, idol_id: event.idolId, event_id: event.id,
      want_to_hear_song_id: draft.wantToHearSongId, opening_song_id: draft.openingSongId,
      finally_heard_song_id: draft.finallyHeardSongId, tearjerker_song_id: draft.tearjerkerSongId,
      hype_song_id: draft.hypeSongId, unforgettable_song_id: draft.unforgettableSongId,
      note: draft.note.trim(), updated_at: new Date().toISOString(),
    };
    const { data, error: saveError } = await supabase.from("concert_music_memories")
      .upsert(payload, { onConflict: "user_id,event_id" }).select(COLUMNS).single();
    if (saveError) throw saveError;
    setEntry(toMemory(data as MemoryRow)); setError(null);
  }, [user?.id, event?.id, event?.idolId, event?.type]);

  return useMemo(() => ({ entry, ready, error, save }), [entry, ready, error, save]);
}
