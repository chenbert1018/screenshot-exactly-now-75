import { supabase } from "@/integrations/supabase/client";
import type { MemoryFolder, MemoryFolderDraft } from "./memory-folders";

/**
 * 雲端 Memory Folder 資料層。
 * 與 localStorage（idoldays.memoryFolders.v1）並存，本階段不做搬移、不刪除本機資料。
 */

type Row = {
  id: string;
  idol_id: string | null;
  title: string;
  description: string | null;
  cover_photo: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

const COLUMNS =
  "id, idol_id, title, description, cover_photo, start_date, end_date, created_at";

function toFolder(row: Row): MemoryFolder {
  return {
    id: row.id,
    idolId: row.idol_id ?? undefined,
    title: row.title,
    description: row.description ?? "",
    coverPhoto: row.cover_photo ?? "",
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    createdAt: row.created_at,
  };
}

function toRow(draft: MemoryFolderDraft) {
  return {
    idol_id: draft.idolId || null,
    title: draft.title,
    description: draft.description ?? "",
    cover_photo: draft.coverPhoto ?? "",
    start_date: draft.startDate || null,
    end_date: draft.endDate || null,
  };
}

export async function listMemoryFolders(): Promise<MemoryFolder[]> {
  const { data, error } = await supabase
    .from("memory_folders")
    .select(COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => toFolder(r as Row));
}

export async function getMemoryFolder(id: string): Promise<MemoryFolder | null> {
  const { data, error } = await supabase
    .from("memory_folders")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toFolder(data as Row) : null;
}

export async function createMemoryFolder(
  draft: MemoryFolderDraft,
  userId: string,
): Promise<MemoryFolder> {
  const { data, error } = await supabase
    .from("memory_folders")
    .insert({ ...toRow(draft), user_id: userId })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toFolder(data as Row);
}

export async function updateMemoryFolder(
  id: string,
  draft: MemoryFolderDraft,
): Promise<MemoryFolder> {
  const { data, error } = await supabase
    .from("memory_folders")
    .update(toRow(draft))
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toFolder(data as Row);
}

/** 刪除資料夾，資料庫會一併刪除其 Memories（不影響 Idol / Event / Milestone） */
export async function deleteMemoryFolder(id: string): Promise<void> {
  const { error } = await supabase.from("memory_folders").delete().eq("id", id);
  if (error) throw error;
}
