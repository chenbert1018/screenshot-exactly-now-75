import { supabase } from "@/integrations/supabase/client";

export type ComebackEraLink = {
  userId: string;
  eventId: string;
  folderId: string;
  createdAt: string;
};

type Row = {
  user_id: string;
  event_id: string;
  folder_id: string;
  created_at: string;
};

function toLink(row: Row): ComebackEraLink {
  return {
    userId: row.user_id,
    eventId: row.event_id,
    folderId: row.folder_id,
    createdAt: row.created_at,
  };
}

/** Persist the canonical Comeback Event ↔ Memory Folder relationship. */
export async function linkComebackEra(
  userId: string,
  eventId: string,
  folderId: string,
): Promise<ComebackEraLink> {
  const { data, error } = await supabase
    .from("comeback_era_memory_folders")
    .insert({ user_id: userId, event_id: eventId, folder_id: folderId })
    .select("user_id, event_id, folder_id, created_at")
    .single();

  if (error) throw error;
  return toLink(data as Row);
}

export async function getComebackEraByFolder(
  folderId: string,
): Promise<ComebackEraLink | null> {
  const { data, error } = await supabase
    .from("comeback_era_memory_folders")
    .select("user_id, event_id, folder_id, created_at")
    .eq("folder_id", folderId)
    .maybeSingle();

  if (error) throw error;
  return data ? toLink(data as Row) : null;
}
