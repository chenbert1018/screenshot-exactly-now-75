import { supabase } from "@/integrations/supabase/client";
import {
  WIDGET_CONTENT_TYPES,
  getDefaultWidgetPreferences,
  type WidgetContentType,
  type WidgetPreferences,
} from "./widget";

/**
 * 雲端 Widget 設定資料層（table: widget_preferences，每位使用者一筆）。
 * 與 localStorage（idoldays.widget.preferences.v1）並存，本階段不做搬移。
 */

type Row = {
  user_id: string;
  idol_id: string | null;
  enabled_contents: string[] | null;
};

const COLUMNS = "user_id, idol_id, enabled_contents";

function toPreferences(row: Row): WidgetPreferences {
  const list = (row.enabled_contents ?? []).filter((t): t is WidgetContentType =>
    (WIDGET_CONTENT_TYPES as readonly string[]).includes(t),
  );
  return {
    ...(row.idol_id ? { idolId: row.idol_id } : {}),
    enabledContents: list.length ? list : getDefaultWidgetPreferences().enabledContents,
  };
}

function toRow(prefs: Partial<WidgetPreferences>) {
  const row: Record<string, unknown> = {};
  if (prefs.idolId !== undefined) row.idol_id = prefs.idolId || null;
  if (prefs.enabledContents !== undefined) row.enabled_contents = prefs.enabledContents;
  return row;
}

/** 取得目前使用者的 Widget 設定；沒有則回傳 null */
export async function getWidgetPreferences(): Promise<WidgetPreferences | null> {
  const { data, error } = await supabase
    .from("widget_preferences")
    .select(COLUMNS)
    .maybeSingle();
  if (error) throw error;
  return data ? toPreferences(data as Row) : null;
}

export async function createWidgetPreferences(
  prefs: WidgetPreferences,
  userId: string,
): Promise<WidgetPreferences> {
  const { data, error } = await supabase
    .from("widget_preferences")
    .insert({ ...toRow(prefs), user_id: userId })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toPreferences(data as Row);
}

/** 更新目前使用者的設定；若尚未存在則建立（每位使用者僅一筆） */
export async function updateWidgetPreferences(
  patch: Partial<WidgetPreferences>,
  userId: string,
): Promise<WidgetPreferences> {
  const existing = await getWidgetPreferences();
  if (!existing) {
    return createWidgetPreferences({ ...getDefaultWidgetPreferences(), ...patch }, userId);
  }
  const { data, error } = await supabase
    .from("widget_preferences")
    .update(toRow(patch))
    .eq("user_id", userId)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toPreferences(data as Row);
}

export async function deleteWidgetPreferences(userId: string): Promise<void> {
  const { error } = await supabase
    .from("widget_preferences")
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
}
