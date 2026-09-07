import { supabase } from "@/integrations/supabase/client";
import { MAX_IDOLS, type Idol, type IdolDraft } from "./idols";

/**
 * 雲端 Idol 資料層。
 * 與 localStorage（idoldays.idols.v1）並存，本階段不做搬移、不刪除本機資料。
 * 欄位對照見 docs/backend-v1a-schema.md。
 */

type Row = {
  id: string;
  name: string;
  group_name: string;
  birthday: string | null;
  debut_date: string | null;
  fan_name: string;
  favorite_color: string;
  since_date: string | null;
  photo: string;
};

function toIdol(row: Row): Idol {
  return {
    id: row.id,
    name: row.name,
    groupName: row.group_name,
    birthday: row.birthday ?? "",
    debutDate: row.debut_date ?? "",
    fanName: row.fan_name,
    favoriteColor: row.favorite_color,
    sinceDate: row.since_date ?? "",
    photo: row.photo,
  };
}

function toRow(draft: IdolDraft) {
  return {
    name: draft.name,
    group_name: draft.groupName,
    birthday: draft.birthday || null,
    debut_date: draft.debutDate || null,
    fan_name: draft.fanName,
    favorite_color: draft.favoriteColor,
    since_date: draft.sinceDate || null,
    photo: draft.photo,
  };
}

const COLUMNS =
  "id, name, group_name, birthday, debut_date, fan_name, favorite_color, since_date, photo, created_at";

export async function listCloudIdols(): Promise<Idol[]> {
  const { data, error } = await supabase
    .from("idols")
    .select(COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => toIdol(r as Row));
}

/** 保留免費 5 位槽位規則 */
export async function createCloudIdol(draft: IdolDraft, userId: string): Promise<Idol> {
  const { count, error: countError } = await supabase
    .from("idols")
    .select("id", { count: "exact", head: true });
  if (countError) throw countError;
  if ((count ?? 0) >= MAX_IDOLS) {
    throw new Error(`最多只能收藏 ${MAX_IDOLS} 位偶像`);
  }

  const { data, error } = await supabase
    .from("idols")
    .insert({ ...toRow(draft), user_id: userId })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toIdol(data as Row);
}

export async function updateCloudIdol(id: string, draft: IdolDraft): Promise<Idol> {
  const { data, error } = await supabase
    .from("idols")
    .update(toRow(draft))
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toIdol(data as Row);
}

export async function deleteCloudIdol(id: string): Promise<void> {
  const { error } = await supabase.from("idols").delete().eq("id", id);
  if (error) throw error;
}
