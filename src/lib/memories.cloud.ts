import { supabase } from "@/integrations/supabase/client";
import type { Memory, MemoryDraft } from "./memories";

/**
 * 雲端 Memory 資料層。
 * 與 localStorage（idoldays.memories.v1）並存，本階段不做搬移、不刪除本機資料。
 */

type Row = {
  id: string;
  folder_id: string;
  idol_id: string | null;
  title: string;
  note: string | null;
  photo: string | null;
  date: string | null;
  created_at: string;
};

const COLUMNS = "id, folder_id, idol_id, title, note, photo, date, created_at";

function toMemory(row: Row): Memory {
  return {
    id: row.id,
    folderId: row.folder_id,
    idolId: row.idol_id ?? undefined,
    title: row.title,
    date: row.date ?? "",
    note: row.note ?? "",
    photo: row.photo ?? "",
    createdAt: row.created_at,
  };
}

function toRow(draft: MemoryDraft) {
  return {
    title: draft.title,
    note: draft.note ?? "",
    photo: draft.photo ?? "",
    date: draft.date || null,
  };
}

/** 列出回憶；傳入 folderId 時只列該資料夾 */
export async function listMemories(folderId?: string): Promise<Memory[]> {
  let query = supabase.from("memories").select(COLUMNS);
  if (folderId) query = query.eq("folder_id", folderId);
  const { data, error } = await query
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => toMemory(r as Row));
}

export async function getMemory(id: string): Promise<Memory | null> {
  const { data, error } = await supabase
    .from("memories")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toMemory(data as Row) : null;
}

export async function createMemory(
  folderId: string,
  draft: MemoryDraft,
  userId: string,
  idolId?: string,
): Promise<Memory> {
  const { data, error } = await supabase
    .from("memories")
    .insert({
      ...toRow(draft),
      folder_id: folderId,
      user_id: userId,
      idol_id: idolId || null,
    })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toMemory(data as Row);
}

export async function updateMemory(id: string, draft: MemoryDraft): Promise<Memory> {
  const { data, error } = await supabase
    .from("memories")
    .update(toRow(draft))
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toMemory(data as Row);
}

export async function deleteMemory(id: string): Promise<void> {
  const { error } = await supabase.from("memories").delete().eq("id", id);
  if (error) throw error;
}
