import { supabase } from "@/integrations/supabase/client";
import type { EventDraft, EventType, IdolEvent } from "./events";

/**
 * 雲端 Event 資料層。
 * 與 localStorage（idoldays.events.v1）並存，本階段不做搬移、不刪除本機資料。
 * 欄位對照見 docs/backend-v1a-schema.md。
 */

type Row = {
  id: string;
  idol_id: string;
  title: string;
  type: string;
  date: string;
  note: string | null;
  created_at: string;
};

const COLUMNS = "id, idol_id, title, type, date, note, created_at";

function toEvent(row: Row): IdolEvent {
  return {
    id: row.id,
    idolId: row.idol_id,
    title: row.title,
    type: row.type as EventType,
    date: row.date,
    note: row.note ?? "",
    createdAt: new Date(row.created_at).getTime(),
  };
}

function toRow(draft: EventDraft) {
  return {
    idol_id: draft.idolId,
    title: draft.title,
    type: draft.type,
    date: draft.date,
    note: draft.note ?? "",
  };
}

export async function listCloudEvents(): Promise<IdolEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select(COLUMNS)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => toEvent(r as Row));
}

export async function getCloudEvent(id: string): Promise<IdolEvent | null> {
  const { data, error } = await supabase.from("events").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toEvent(data as Row) : null;
}

export async function createCloudEvent(draft: EventDraft, userId: string): Promise<IdolEvent> {
  const { data, error } = await supabase
    .from("events")
    .insert({ ...toRow(draft), user_id: userId })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toEvent(data as Row);
}

export async function updateCloudEvent(id: string, draft: EventDraft): Promise<IdolEvent> {
  const { data, error } = await supabase
    .from("events")
    .update(toRow(draft))
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toEvent(data as Row);
}

/** 刪除 Event，資料庫會一併刪除其 Milestones（不影響 Idol） */
export async function deleteCloudEvent(id: string): Promise<void> {
  // 個人收藏不應因刪除日子而消失；只解除 event 關聯。
  const { error: collectionError } = await supabase
    .from("collection_items")
    .update({ event_id: null })
    .eq("event_id", id);
  if (collectionError) throw collectionError;

  // 活動專屬的輕量回憶屬於這個 event lifecycle，明確刪除，不依賴 cascade。
  const { error: concertError } = await supabase
    .from("concert_personal_memories")
    .delete()
    .eq("event_id", id);
  if (concertError) throw concertError;

  const { error: meetError } = await supabase
    .from("meet_memories")
    .delete()
    .eq("event_id", id);
  if (meetError) throw meetError;

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}
