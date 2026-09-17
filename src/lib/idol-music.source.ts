import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import type { IdolSong, IdolSongDraft, IdolSongRole, SongRole } from "./idol-music";

type SongRow = {
  id: string; idol_id: string; title: string; artist: string; album: string;
  apple_music_url: string; spotify_url: string; is_today_pick: boolean; created_at: string;
};
type RoleRow = { id: string; idol_id: string; song_id: string; role: SongRole };

const COLUMNS = "id, idol_id, title, artist, album, apple_music_url, spotify_url, is_today_pick, created_at";

function toSong(row: SongRow): IdolSong {
  return { id: row.id, idolId: row.idol_id, title: row.title, artist: row.artist, album: row.album,
    appleMusicUrl: row.apple_music_url, spotifyUrl: row.spotify_url, isTodayPick: row.is_today_pick, createdAt: row.created_at };
}
function toRole(row: RoleRow): IdolSongRole { return { id: row.id, idolId: row.idol_id, songId: row.song_id, role: row.role }; }

export function useIdolMusicSource(idolId?: string) {
  const { user, loading: authLoading } = useAuth();
  const [songs, setSongs] = useState<IdolSong[]>([]);
  const [roles, setRoles] = useState<IdolSongRole[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  const reload = useCallback(() => setRefresh((value) => value + 1), []);
  useEffect(() => {
    if (authLoading) return;
    if (!user || !idolId) { setSongs([]); setRoles([]); setReady(true); setError(null); return; }
    let active = true;
    setReady(false);
    void (async () => {
      const [songsResult, rolesResult] = await Promise.all([
        supabase.from("idol_songs").select(COLUMNS).eq("idol_id", idolId).order("created_at", { ascending: false }),
        supabase.from("idol_song_roles").select("id, idol_id, song_id, role").eq("idol_id", idolId),
      ]);
      if (!active) return;
      if (songsResult.error || rolesResult.error) {
        setError(songsResult.error?.message ?? rolesResult.error?.message ?? "歌曲資料讀取失敗");
        setReady(true); return;
      }
      setSongs((songsResult.data ?? []).map((row) => toSong(row as SongRow)));
      setRoles((rolesResult.data ?? []).map((row) => toRole(row as RoleRow)));
      setError(null); setReady(true);
    })();
    return () => { active = false; };
  }, [authLoading, user?.id, idolId, refresh]);

  const addSong = useCallback(async (draft: IdolSongDraft) => {
    if (!user || !idolId) throw new Error("請先登入並選擇偶像");
    const { error } = await supabase.from("idol_songs").insert({
      user_id: user.id, idol_id: idolId, title: draft.title.trim(), artist: draft.artist.trim(), album: draft.album.trim(),
      apple_music_url: draft.appleMusicUrl.trim(), spotify_url: draft.spotifyUrl.trim(),
    });
    if (error) throw error; reload();
  }, [user?.id, idolId, reload]);

  const setTodayPick = useCallback(async (songId: string) => {
    if (!user || !idolId) throw new Error("請先登入並選擇偶像");
    const { error: clearError } = await supabase.from("idol_songs").update({ is_today_pick: false }).eq("idol_id", idolId).eq("user_id", user.id).eq("is_today_pick", true);
    if (clearError) throw clearError;
    const { error } = await supabase.from("idol_songs").update({ is_today_pick: true }).eq("id", songId).eq("user_id", user.id);
    if (error) throw error; reload();
  }, [user?.id, idolId, reload]);

  const assignRole = useCallback(async (role: SongRole, songId: string) => {
    if (!user || !idolId) throw new Error("請先登入並選擇偶像");
    const { error } = await supabase.from("idol_song_roles").upsert({ user_id: user.id, idol_id: idolId, song_id: songId, role }, { onConflict: "user_id,idol_id,role" });
    if (error) throw error; reload();
  }, [user?.id, idolId, reload]);

  const removeSong = useCallback(async (songId: string) => {
    if (!user) throw new Error("請先登入");
    const { error } = await supabase.from("idol_songs").delete().eq("id", songId).eq("user_id", user.id);
    if (error) throw error; reload();
  }, [user?.id, reload]);

  return useMemo(() => ({ songs, roles, ready, error, reload, addSong, setTodayPick, assignRole, removeSong }), [songs, roles, ready, error, reload, addSong, setTodayPick, assignRole, removeSong]);
}
