import { supabase } from "@/integrations/supabase/client";
import type { ConcertPersonalMemory,ConcertPersonalMemoryDraft } from "./concert-personal-memory";
type Row={event_id:string;seat:string|null;unforgettable_moment:string|null;photo:string|null;created_at:string;updated_at:string};
const cols="event_id,seat,unforgettable_moment,photo,created_at,updated_at";
const toEntry=(r:Row):ConcertPersonalMemory=>({eventId:r.event_id,seat:r.seat??undefined,unforgettableMoment:r.unforgettable_moment??undefined,photo:r.photo??undefined,createdAt:r.created_at,updatedAt:r.updated_at});
export async function getCloudConcertMemory(eventId:string){const {data,error}=await supabase.from("concert_personal_memories").select(cols).eq("event_id",eventId).maybeSingle();if(error)throw error;return data?toEntry(data as unknown as Row):null}
export async function saveCloudConcertMemory(userId:string,eventId:string,idolId:string,d:ConcertPersonalMemoryDraft){const {data,error}=await supabase.from("concert_personal_memories").upsert({user_id:userId,event_id:eventId,idol_id:idolId||null,seat:d.seat.trim()||null,unforgettable_moment:d.unforgettableMoment.trim()||null,photo:d.photo||null,updated_at:new Date().toISOString()},{onConflict:"user_id,event_id"}).select(cols).single();if(error)throw error;return toEntry(data as unknown as Row)}
