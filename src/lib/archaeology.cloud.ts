import { supabase } from "@/integrations/supabase/client";
import type {
  ArchaeologyDraft,
  ArchaeologyItem,
  ArchaeologySource,
} from "./archaeology";

type Row = {
  id: string;
  idol_id: string | null;
  url: string;
  title: string;
  image_url: string;
  source: string;
  collection: string;
  tags: string[];
  note: string;
  favorite: boolean;
  created_at: string;
};

const COLUMNS =
  "id, idol_id, url, title, image_url, source, collection, tags, note, favorite, created_at";

function table() {
  return (supabase as any).from("archaeology_items");
}

function toItem(row: Row): ArchaeologyItem {
  return {
    id: row.id,
    idolId: row.idol_id ?? undefined,
    url: row.url,
    title: row.title,
    imageUrl: row.image_url || undefined,
    source: row.source as ArchaeologySource,
    collection: row.collection,
    tags: row.tags ?? [],
    note: row.note,
    favorite: row.favorite,
    createdAt: row.created_at,
  };
}

function toRow(draft: ArchaeologyDraft) {
  return {
    idol_id: draft.idolId || null,
    url: draft.url.trim(),
    title: draft.title.trim(),
    image_url: draft.imageUrl?.trim() ?? "",
    source: detectSource(draft.url),
    collection: draft.collection.trim(),
    tags: draft.tags.map((tag) => tag.trim()).filter(Boolean),
    note: draft.note.trim(),
  };
}

function detectSource(url: string): ArchaeologySource {
  const value = url.toLowerCase();
  if (value.includes("threads.net") || value.includes("threads.com")) return "THREADS";
  if (value.includes("twitter.com") || value.includes("x.com")) return "X";
  if (value.includes("youtube.com") || value.includes("youtu.be")) return "YOUTUBE";
  if (value.includes("tiktok.com")) return "TIKTOK";
  if (value.includes("instagram.com")) return "INSTAGRAM";
  return "WEB";
}

export async function listCloudArchaeology(): Promise<ArchaeologyItem[]> {
  const { data, error } = await table()
    .select(COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: Row) => toItem(row));
}

export async function createCloudArchaeology(
  draft: ArchaeologyDraft,
  userId: string,
  favorite = false,
): Promise<ArchaeologyItem> {
  const { data, error } = await table()
    .insert({ ...toRow(draft), user_id: userId, favorite })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toItem(data as Row);
}

export async function updateCloudArchaeology(
  id: string,
  draft: ArchaeologyDraft,
): Promise<ArchaeologyItem> {
  const { data, error } = await table()
    .update({ ...toRow(draft), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toItem(data as Row);
}

export async function updateCloudArchaeologyImage(
  id: string,
  imageUrl: string,
): Promise<void> {
  const { error } = await table()
    .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function setCloudArchaeologyFavorite(
  id: string,
  favorite: boolean,
): Promise<void> {
  const { error } = await table()
    .update({ favorite, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCloudArchaeology(id: string): Promise<void> {
  const { error } = await table().delete().eq("id", id);
  if (error) throw error;
}
