import { useCallback,useEffect,useState } from "react";
import type { CollectionDraft,CollectionItem } from "./collection";
import { useAuth } from "./auth";
import { createCloudCollection,deleteCloudCollection,listCloudCollection,updateCloudCollection } from "./collection.cloud";
import { ensureEventMigration } from "./events.source";
import { isDataUrl,uploadImage } from "./storage";
const KEY="idoldays.collection.v1", MIGRATION_KEY="idoldays.cloudMigration.collection.v1";
function read():CollectionItem[]{if(typeof window==="undefined")return[];try{const v=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(v)?v:[]}catch{return[]}}
function write(v:CollectionItem[]){localStorage.setItem(KEY,JSON.stringify(v));}
function migrated(userId:string){try{return localStorage.getItem(MIGRATION_KEY)===userId}catch{return false}}
function markMigrated(userId:string){try{localStorage.setItem(MIGRATION_KEY,userId)}catch{}}
async function migrate(userId:string){if(migrated(userId))return;const {idolMap,eventMap}=await ensureEventMigration(userId);const cloud=await listCloudCollection();for(const item of read()){if(cloud.some(x=>x.title.trim()===item.title.trim()&&x.category===item.category&&(x.acquiredDate||"")===(item.acquiredDate||"")))continue;const idolId=item.idolId?(idolMap[item.idolId]??(Object.values(idolMap).includes(item.idolId)?item.idolId:"")):"";const eventId=item.eventId?(eventMap[item.eventId]??(Object.values(eventMap).includes(item.eventId)?item.eventId:"")):"";try{const created=await createCloudCollection({...item,idolId,eventId},userId);if(item.photo&&isDataUrl(item.photo)){const ref=await uploadImage(userId,"collection",created.id,item.photo);if(ref)await updateCloudCollection(created.id,{...item,idolId,eventId,photo:ref})}}catch{}}markMigrated(userId)}
export function useCollectionSource(){
 const {user,loading}=useAuth(); const local=useState<CollectionItem[]>([]); const [items,setItems]=local; const [ready,setReady]=useState(false); const userId=user?.id??null;
 const reload=useCallback(async()=>{if(userId){await migrate(userId);setItems(await listCloudCollection())}else setItems(read());setReady(true)},[userId]);
 useEffect(()=>{setReady(false);void reload()},[reload]);
 const addItem=useCallback(async(d:CollectionDraft)=>{if(userId){const item=await createCloudCollection(d,userId);if(d.photo&&isDataUrl(d.photo)){const ref=await uploadImage(userId,"collection",item.id,d.photo);if(ref){await updateCloudCollection(item.id,{...d,photo:ref});item.photo=ref}}setItems(await listCloudCollection());return item}const item:CollectionItem={...d,id:crypto.randomUUID(),origin:"USER",createdAt:new Date().toISOString()};const next=[item,...read()];write(next);setItems(next);return item},[userId]);
 const updateItem=useCallback(async(id:string,d:CollectionDraft)=>{if(userId){let draft=d;if(d.photo&&isDataUrl(d.photo)){const ref=await uploadImage(userId,"collection",id,d.photo);if(ref)draft={...d,photo:ref}}await updateCloudCollection(id,draft);setItems(await listCloudCollection());return}const next=read().map(i=>i.id===id?{...i,...d}:i);write(next);setItems(next)},[userId]);
 const removeItem=useCallback(async(id:string)=>{if(userId){await deleteCloudCollection(id);setItems(await listCloudCollection());return}const next=read().filter(i=>i.id!==id);write(next);setItems(next)},[userId]);
 return {items,ready:ready&&!loading,addItem,updateItem,removeItem};
}
