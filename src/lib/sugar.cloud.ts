import { supabase } from "@/integrations/supabase/client";
import type { HeartItem, HeartItemType } from "./heart";

/**
 * 雲端「嗑糖」資料層（table: sugar_items）。
 * 與 localStorage（idoldays.heart.v1）並存，本階段不做搬移、不改變既有 UI。
 */

type Row = {
  id: string;
  idol_id: string | null;
  title: string;
  date: string | null;
  type: string;
  note: string | null;
  image: string | null;
  link: string | null;
  created_at: string;
};

const COLUMNS = "id, idol_id, title, date, type, note, image, link, created_at";

export type SugarItemInput = {
  idolId?: string | null;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  type: HeartItemType;
  note?: string;
  image?: string;
  link?: string;
};

function toItem(row: Row): HeartItem {
  return {
    id: row.id,
    idolId: row.idol_id ?? "",
    title: row.title,
    date: row.date ?? "",
    type: row.type as HeartItemType,
    note: row.note ?? "",
    image: row.image ?? "",
    link: row.link ?? "",
    createdAt: row.created_at,
  };
}

function toRow(input: Partial<SugarItemInput>) {
  const row: Record<string, unknown> = {};
  if (input.idolId !== undefined) row.idol_id = input.idolId || null;
  if (input.title !== undefined) row.title = input.title;
  if (input.date !== undefined) row.date = input.date || null;
  if (input.type !== undefined) row.type = input.type;
  if (input.note !== undefined) row.note = input.note ?? "";
  if (input.image !== undefined) row.image = input.image ?? "";
  if (input.link !== undefined) row.link = input.link ?? "";
  return row;
}

export async function listSugarItems(): Promise<HeartItem[]> {
  const { data, error } = await supabase
    .from("sugar_items")
    .select(COLUMNS)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => toItem(r as Row));
}

export async function getSugarItem(id: string): Promise<HeartItem | null> {
  const { data, error } = await supabase
    .from("sugar_items")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toItem(data as Row) : null;
}

export async function createSugarItem(
  input: SugarItemInput,
  userId: string,
): Promise<HeartItem> {
  const { data, error } = await supabase
    .from("sugar_items")
    .insert({ ...toRow(input), user_id: userId })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toItem(data as Row);
}

export async function updateSugarItem(
  id: string,
  input: Partial<SugarItemInput>,
): Promise<HeartItem> {
  const { data, error } = await supabase
    .from("sugar_items")
    .update(toRow(input))
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toItem(data as Row);
}

export async function deleteSugarItem(id: string): Promise<void> {
  const { error } = await supabase.from("sugar_items").delete().eq("id", id);
  if (error) throw error;
}
