import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import { localDateKey, type IdolSongJournalEntry, type SongMood } from "./idol-song-journal";

type EntryRow = {
  id: string;
  user_id: string;
  idol_id: string;
  song_id: string | null;
  entry_date: string;
  mood: SongMood | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS = "id, user_id, idol_id, song_id, entry_date, mood, created_at, updated_at";

function toEntry(row: EntryRow): IdolSongJournalEntry {
  return {
    id: row.id,
    userId: row.user_id,
    idolId: row.idol_id,
    songId: row.song_id,
    entryDate: row.entry_date,
    mood: row.mood,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** The single lightweight music diary entry for the selected idol and local day. */
export function useTodaySongJournal(idolId?: string, date = localDateKey()) {
  const { user, loading: authLoading } = useAuth();
  const [entry, setEntry] = useState<IdolSongJournalEntry | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !idolId) {
      setEntry(null);
      setError(null);
      setReady(true);
      return;
    }

    let active = true;
    setReady(false);
    void supabase
      .from("idol_song_journal_entries")
      .select(COLUMNS)
      .eq("idol_id", idolId)
      .eq("entry_date", date)
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) {
          setError(queryError.message);
          setEntry(null);
        } else {
          setError(null);
          setEntry(data ? toEntry(data as EntryRow) : null);
        }
        setReady(true);
      });

    return () => {
      active = false;
    };
  }, [authLoading, user?.id, idolId, date]);

  const save = useCallback(
    async (patch: { songId?: string | null; mood?: SongMood | null }) => {
      if (!user || !idolId) throw new Error("請先登入並選擇偶像");
      const payload = {
        user_id: user.id,
        idol_id: idolId,
        entry_date: date,
        ...(patch.songId !== undefined ? { song_id: patch.songId } : {}),
        ...(patch.mood !== undefined ? { mood: patch.mood } : {}),
        updated_at: new Date().toISOString(),
      };
      const { data, error: saveError } = await supabase
        .from("idol_song_journal_entries")
        .upsert(payload, { onConflict: "user_id,idol_id,entry_date" })
        .select(COLUMNS)
        .single();
      if (saveError) throw saveError;
      setEntry(toEntry(data as EntryRow));
      setError(null);
    },
    [user?.id, idolId, date],
  );

  return useMemo(() => ({ entry, ready, error, save }), [entry, ready, error, save]);
}

/**
 * 選定偶像的歷史音樂日記。
 * Random Memory 使用；只讀目前登入使用者在 RLS 範圍內的資料。
 */
export function useSongJournalHistory(idolId?: string, limit = 60) {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<IdolSongJournalEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !idolId) {
      setEntries([]);
      setError(null);
      setReady(true);
      return;
    }

    let active = true;
    setReady(false);

    void supabase
      .from("idol_song_journal_entries")
      .select(COLUMNS)
      .eq("idol_id", idolId)
      .not("song_id", "is", null)
      .order("entry_date", { ascending: false })
      .limit(limit)
      .then(({ data, error: queryError }) => {
        if (!active) return;

        if (queryError) {
          setEntries([]);
          setError(queryError.message);
        } else {
          setEntries(((data ?? []) as EntryRow[]).map(toEntry));
          setError(null);
        }

        setReady(true);
      });

    return () => {
      active = false;
    };
  }, [authLoading, user?.id, idolId, limit]);

  return useMemo(
    () => ({ entries, ready, error }),
    [entries, ready, error],
  );
}
