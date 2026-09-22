import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ComebackDiary } from "./comeback-diary";

export type ComebackEraLink = {
  userId: string;
  eventId: string;
  folderId: string;
  createdAt: string;
};

type Row = {
  user_id: string;
  event_id: string;
  folder_id: string;
  created_at: string;
};

function toLink(row: Row): ComebackEraLink {
  return {
    userId: row.user_id,
    eventId: row.event_id,
    folderId: row.folder_id,
    createdAt: row.created_at,
  };
}

/** Persist the canonical Comeback Event ↔ Memory Folder relationship. */
export async function linkComebackEra(
  userId: string,
  eventId: string,
  folderId: string,
): Promise<ComebackEraLink> {
  const { data, error } = await supabase
    .from("comeback_era_memory_folders")
    .insert({ user_id: userId, event_id: eventId, folder_id: folderId })
    .select("user_id, event_id, folder_id, created_at")
    .single();

  if (error) throw error;
  return toLink(data as Row);
}

/** Explicitly unlink an Era before deleting its Event or Memory Folder. */
export async function unlinkComebackEraByEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from("comeback_era_memory_folders")
    .delete()
    .eq("event_id", eventId);
  if (error) throw error;
}

export async function unlinkComebackEraByFolder(folderId: string): Promise<void> {
  const { error } = await supabase
    .from("comeback_era_memory_folders")
    .delete()
    .eq("folder_id", folderId);
  if (error) throw error;
}

export async function getComebackEraByEvent(
  eventId: string,
): Promise<ComebackEraLink | null> {
  const { data, error } = await supabase
    .from("comeback_era_memory_folders")
    .select("user_id, event_id, folder_id, created_at")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) throw error;
  return data ? toLink(data as Row) : null;
}

export async function getComebackEraByFolder(
  folderId: string,
): Promise<ComebackEraLink | null> {
  const { data, error } = await supabase
    .from("comeback_era_memory_folders")
    .select("user_id, event_id, folder_id, created_at")
    .eq("folder_id", folderId)
    .maybeSingle();

  if (error) throw error;
  return data ? toLink(data as Row) : null;
}


type EraDiaryRow = {
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

function toDiary(row: EraDiaryRow): ComebackDiary {
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

/** Read the canonical Comeback Diary that starts a linked Era folder. */
export function useComebackEra(folderId?: string) {
  const [link, setLink] = useState<ComebackEraLink | null>(null);
  const [diary, setDiary] = useState<ComebackDiary | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!folderId) {
      setLink(null);
      setDiary(null);
      setReady(true);
      return;
    }

    let active = true;
    setReady(false);

    void (async () => {
      try {
        const eraLink = await getComebackEraByFolder(folderId);
        if (!active) return;
        setLink(eraLink);

        if (!eraLink) {
          setDiary(null);
          return;
        }

        const { data, error } = await supabase
          .from("comeback_diaries")
          .select("id, user_id, idol_id, event_id, first_listen_rating, first_favorite_song_id, later_favorite_song_id, want_to_hear_live_song_id, note, created_at, updated_at")
          .eq("event_id", eraLink.eventId)
          .maybeSingle();

        if (error) throw error;
        if (!active) return;
        setDiary(data ? toDiary(data as EraDiaryRow) : null);
      } catch {
        if (!active) return;
        setLink(null);
        setDiary(null);
      } finally {
        if (active) setReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [folderId]);

  return { link, diary, ready };
}
