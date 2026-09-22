import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import { localDateKey, type SongMood } from "./idol-song-journal";
import type {
  ListenAgainEntry,
  SaveListenAgainInput,
} from "./listen-again";

type ListenAgainRow = {
  id: string;
  user_id: string;
  idol_id: string;
  song_id: string;
  source_journal_entry_id: string | null;
  original_date: string;
  original_mood: SongMood | null;
  listen_again_date: string;
  current_mood: SongMood;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  "id, user_id, idol_id, song_id, source_journal_entry_id, original_date, original_mood, listen_again_date, current_mood, created_at, updated_at";

function toEntry(row: ListenAgainRow): ListenAgainEntry {
  return {
    id: row.id,
    userId: row.user_id,
    idolId: row.idol_id,
    songId: row.song_id,
    sourceJournalEntryId: row.source_journal_entry_id,
    originalDate: row.original_date,
    originalMood: row.original_mood,
    listenAgainDate: row.listen_again_date,
    currentMood: row.current_mood,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useListenAgainHistory(idolId?: string) {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<ListenAgainEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !idolId) {
      setEntries([]);
      setError(null);
      setReady(true);
      return;
    }

    setReady(false);

    const { data, error: queryError } = await supabase
      .from("idol_song_listen_again_entries")
      .select(COLUMNS)
      .eq("idol_id", idolId)
      .order("listen_again_date", { ascending: false });

    if (queryError) {
      setEntries([]);
      setError(queryError.message);
    } else {
      setEntries(((data ?? []) as ListenAgainRow[]).map(toEntry));
      setError(null);
    }

    setReady(true);
  }, [user?.id, idolId]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  const saveListenAgain = useCallback(
    async (input: SaveListenAgainInput) => {
      if (!user || !idolId) {
        throw new Error("請先登入並選擇偶像");
      }

      const listenAgainDate = localDateKey();

      const payload = {
        user_id: user.id,
        idol_id: idolId,
        song_id: input.songId,
        source_journal_entry_id:
          input.sourceJournalEntryId ?? null,
        original_date: input.originalDate,
        original_mood: input.originalMood ?? null,
        listen_again_date: listenAgainDate,
        current_mood: input.currentMood,
        updated_at: new Date().toISOString(),
      };

      const { data, error: saveError } = await supabase
        .from("idol_song_listen_again_entries")
        .upsert(payload, {
          onConflict:
            "user_id,idol_id,song_id,listen_again_date",
        })
        .select(COLUMNS)
        .single();

      if (saveError) throw saveError;

      const saved = toEntry(data as ListenAgainRow);

      setEntries((current) => [
        saved,
        ...current.filter((entry) => entry.id !== saved.id),
      ]);

      setError(null);
      return saved;
    },
    [user?.id, idolId],
  );

  return useMemo(
    () => ({
      entries,
      ready,
      error,
      refresh,
      saveListenAgain,
    }),
    [entries, ready, error, refresh, saveListenAgain],
  );
}
