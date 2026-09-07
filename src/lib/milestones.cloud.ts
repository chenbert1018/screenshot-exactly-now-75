import { supabase } from "@/integrations/supabase/client";
import type { Milestone, MilestoneDraft } from "./milestones";

/**
 * 雲端 Milestone 資料層。
 * 與 localStorage（idoldays.milestones.v1）並存，本階段不做搬移、不刪除本機資料。
 */

type Row = {
  id: string;
  event_id: string;
  title: string;
  date: string | null;
  emoji: string | null;
  completed: boolean;
  created_at: string;
};

const COLUMNS = "id, event_id, title, date, emoji, completed, created_at";

function toMilestone(row: Row): Milestone {
  return {
    id: row.id,
    eventId: row.event_id,
    title: row.title,
    date: row.date ?? "",
    emoji: row.emoji ?? "",
    completed: row.completed,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function listCloudMilestones(eventId: string): Promise<Milestone[]> {
  const { data, error } = await supabase
    .from("milestones")
    .select(COLUMNS)
    .eq("event_id", eventId)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => toMilestone(r as Row));
}

export async function createCloudMilestone(
  eventId: string,
  draft: MilestoneDraft,
  userId: string,
): Promise<Milestone> {
  const { data, error } = await supabase
    .from("milestones")
    .insert({
      event_id: eventId,
      user_id: userId,
      title: draft.title,
      date: draft.date || null,
      emoji: draft.emoji ?? "",
    })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toMilestone(data as Row);
}

export async function updateCloudMilestone(
  id: string,
  patch: Partial<MilestoneDraft> & { completed?: boolean },
): Promise<Milestone> {
  const row: {
    title?: string;
    date?: string | null;
    emoji?: string;
    completed?: boolean;
  } = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.date !== undefined) row.date = patch.date || null;
  if (patch.emoji !== undefined) row.emoji = patch.emoji;
  if (patch.completed !== undefined) row.completed = patch.completed;


  const { data, error } = await supabase
    .from("milestones")
    .update(row)
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toMilestone(data as Row);
}

export async function deleteCloudMilestone(id: string): Promise<void> {
  const { error } = await supabase.from("milestones").delete().eq("id", id);
  if (error) throw error;
}
