import { supabase } from "@/integrations/supabase/client";

export type PublicSharedAlbum = {
  folder: {
    title: string;
    coverPhoto: string;
  };
  memories: Array<{ id: string; title: string; note: string; photo: string; date: string | null }>;
};

/** Only the Edge Function can resolve a public token and issue short-lived media URLs. */
export async function loadPublicSharedAlbum(token: string): Promise<PublicSharedAlbum | null> {
  if (!/^[a-f0-9]{48}$/.test(token)) return null;
  const { data, error } = await supabase.functions.invoke("shared-album", { body: { token } });
  if (error || !data || typeof data !== "object") return null;
  return data as PublicSharedAlbum;
}
