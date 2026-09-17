import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import type { ComebackDiary, ComebackDiaryDraft } from "./comeback-diary";

type DiaryRow = {
  id: string;
  user_id: string;
  idol_id: string;
  event_id: string;
  first_listen_rating: number | null;
  first_favorite_song_id: string | null;
  later_favorite_song_id: string | null;
  want_to_hear_live_song_id: string | null;
  note: string;
  created_at: string;
  updated_at: string;
};

const COLUMNS = "id, user_id, idol_id, event_id, first_listen_rating, first_favorite_song_id, later_favorite_song_id, want_to_hear_live_song_id, note, created_at, updated_at";

function toDiary(row: DiaryRow): ComebackDiary {
  return {
    id: row.id,
    userId: row.user_id,
    idolId: row.idol_id,
    eventId: row.event_id,
    firstListenRating: row.first_listen_rating,
    firstFavoriteSongId: row.first_favorite_song_id,
    laterFavoriteSongId: row.later_favorite_song_id,
    wantToHearLiveSongId: row.want_to_hear_live_song_id,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** A private music diary attached to exactly one comeback event. */
export function useComebackDiary(event?: { id: string; idolId: string; type: string } | null) {
  const { user, loading: authLoading } = useAuth();
  const [entry, setEntry] = useState<ComebackDiary | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !event || event.type !== "COMEBACK") {
      setEntry(null);
      setError(null);
      setReady(true);
      return;
    }
    let active = true;
    setReady(false);
    void supabase
      .from("comeback_diaries")
      .select(COLUMNS)
      .eq("event_id", event.id)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (!active) return;
        if (loadError) {
          setEntry(null);
          setError(loadError.message);
        } else {
          setEntry(data ? toDiary(data as DiaryRow) : null);
          setError(null);
        }
        setReady(true);
      });
    return () => { active = false; };
  }, [authLoading, user?.id, event?.id, event?.type]);

  const save = useCallback(async (draft: ComebackDiaryDraft) => {
    if (!user || !event || event.type !== "COMEBACK") throw new Error("請先登入並開啟一個回歸日子");
    const payload = {
      user_id: user.id,
      idol_id: event.idolId,
      event_id: event.id,
      first_listen_rating: draft.firstListenRating,
      first_favorite_song_id: draft.firstFavoriteSongId,
      later_favorite_song_id: draft.laterFavoriteSongId,
      want_to_hear_live_song_id: draft.wantToHearLiveSongId,
      note: draft.note.trim(),
      updated_at: new Date().toISOString(),
    };
    const { data, error: saveError } = await supabase
      .from("comeback_diaries")
      .upsert(payload, { onConflict: "user_id,event_id" })
      .select(COLUMNS)
      .single();
    if (saveError) throw saveError;
    setEntry(toDiary(data as DiaryRow));
    setError(null);
  }, [user?.id, event?.id, event?.idolId, event?.type]);

  return useMemo(() => ({ entry, ready, error, save }), [entry, ready, error, save]);
}

/** Music Timeline 用：讀取目前登入使用者、指定偶像的 Comeback Diary 歷史。 */
export function useComebackDiaryHistory(idolId?: string, limit = 50) {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<ComebackDiary[]>([]);
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
      .from("comeback_diaries")
      .select(COLUMNS)
      .eq("idol_id", idolId)
      .order("created_at", { ascending: false })
      .limit(limit)
      .then(({ data, error: loadError }) => {
        if (!active) return;

        if (loadError) {
          setEntries([]);
          setError(loadError.message);
        } else {
          setEntries(((data ?? []) as DiaryRow[]).map(toDiary));
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
