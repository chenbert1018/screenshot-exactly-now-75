import { supabase } from "@/integrations/supabase/client";
import { MAX_IDOLS, type Idol, type IdolDraft, type RepresentativeAnimal } from "./idols";

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
  representative_animal: RepresentativeAnimal;
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
    representativeAnimal: row.representative_animal,
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
    representative_animal: draft.representativeAnimal ?? "DOG",
  };
}

const COLUMNS =
  "id, name, group_name, birthday, debut_date, fan_name, favorite_color, since_date, photo, representative_animal, created_at";

export async function listCloudIdols(): Promise<Idol[]> {
  const { data, error } = await supabase
    .from("idols")
    .select(COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => toIdol(r as Row));
}

/**
 * 建立偶像時同時套用目前帳號可用的槽位上限。
 * MAX_IDOLS 是系統硬上限；呼叫端提供的 limit 則反映免費／Plus 權限。
 */
export async function createCloudIdol(
  draft: IdolDraft,
  userId: string,
  limit = MAX_IDOLS,
): Promise<Idol> {
  const allowed = Math.min(Math.max(1, limit), MAX_IDOLS);
  const { count, error: countError } = await supabase
    .from("idols")
    .select("id", { count: "exact", head: true });
  if (countError) throw countError;
  if ((count ?? 0) >= allowed) {
    throw new Error(`目前方案最多只能收藏 ${allowed} 位偶像`);
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
