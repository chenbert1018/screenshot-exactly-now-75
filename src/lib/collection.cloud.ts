import { supabase } from "@/integrations/supabase/client";
import type { CollectionDraft, CollectionItem, CollectionOrigin, CollectionProvenance, CollectionCategory } from "./collection";

type Row = { id:string; user_id:string; idol_id:string|null; event_id:string|null; category:string; provenance:string|null; title:string; photo:string|null; acquired_date:string|null; source:string|null; note:string|null; favorite:boolean; origin:string; created_at:string };
const toItem=(r:Row):CollectionItem=>({id:r.id,idolId:r.idol_id??undefined,eventId:r.event_id??undefined,category:r.category as CollectionCategory,provenance:(r.provenance??"UNSPECIFIED") as CollectionProvenance,title:r.title,photo:r.photo??undefined,acquiredDate:r.acquired_date??undefined,source:r.source??undefined,note:r.note??undefined,favorite:r.favorite,origin:r.origin as CollectionOrigin,createdAt:r.created_at});
const cols="id,user_id,idol_id,event_id,category,provenance,title,photo,acquired_date,source,note,favorite,origin,created_at";
const payload=(d:CollectionDraft)=>({idol_id:d.idolId||null,event_id:d.eventId||null,category:d.category,provenance:d.provenance??"UNSPECIFIED",title:d.title,photo:d.photo||null,acquired_date:d.acquiredDate||null,source:d.source||null,note:d.note||null,favorite:d.favorite});
export async function listCloudCollection(){const {data,error}=await supabase.from("collection_items").select(cols).order("created_at",{ascending:false});if(error)throw error;return (data as unknown as Row[]).map(toItem)}
export async function createCloudCollection(d:CollectionDraft,userId:string){const {data,error}=await supabase.from("collection_items").insert({...payload(d),user_id:userId,origin:"USER"}).select(cols).single();if(error)throw error;return toItem(data as unknown as Row)}
export async function updateCloudCollection(id:string,d:CollectionDraft){const {error}=await supabase.from("collection_items").update(payload(d)).eq("id",id);if(error)throw error}
export async function deleteCloudCollection(id:string){const {error}=await supabase.from("collection_items").delete().eq("id",id);if(error)throw error}
