import { supabase } from "@/integrations/supabase/client";
import type { Reminder, ReminderType } from "./reminders";

/**
 * 雲端 Reminder 資料層。
 * 與 localStorage（idoldays.reminders.v1）並存，本階段不做搬移、不改變既有 UI。
 */

type Row = {
  id: string;
  event_id: string | null;
  idol_id: string | null;
  type: string;
  days_before: number;
  enabled: boolean;
  created_at: string;
};

const COLUMNS = "id, event_id, idol_id, type, days_before, enabled, created_at";

export type ReminderCloudInput = {
  type: ReminderType;
  daysBefore: number;
  enabled?: boolean;
  eventId?: string | null;
  idolId?: string | null;
};

function toReminder(row: Row): Reminder {
  return {
    id: row.id,
    type: row.type as ReminderType,
    daysBefore: row.days_before,
    enabled: row.enabled,
    createdAt: row.created_at,
    ...(row.event_id ? { eventId: row.event_id } : {}),
    ...(row.idol_id ? { idolId: row.idol_id } : {}),
  };
}

function toRow(input: Partial<ReminderCloudInput>) {
  const row: Record<string, unknown> = {};
  if (input.type !== undefined) row.type = input.type;
  if (input.daysBefore !== undefined) row.days_before = input.daysBefore;
  if (input.enabled !== undefined) row.enabled = input.enabled;
  if (input.eventId !== undefined) row.event_id = input.eventId || null;
  if (input.idolId !== undefined) row.idol_id = input.idolId || null;
  return row;
}

export async function listReminders(): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from("reminders")
    .select(COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => toReminder(r as Row));
}

export async function getReminder(id: string): Promise<Reminder | null> {
  const { data, error } = await supabase
    .from("reminders")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toReminder(data as Row) : null;
}

export async function createReminder(
  input: ReminderCloudInput,
  userId: string,
): Promise<Reminder> {
  const { data, error } = await supabase
    .from("reminders")
    .insert({ ...toRow(input), user_id: userId })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toReminder(data as Row);
}

export async function updateReminder(
  id: string,
  input: Partial<ReminderCloudInput>,
): Promise<Reminder> {
  const { data, error } = await supabase
    .from("reminders")
    .update(toRow(input))
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toReminder(data as Row);
}

export async function deleteReminder(id: string): Promise<void> {
  const { error } = await supabase.from("reminders").delete().eq("id", id);
  if (error) throw error;
}
