import { useCallback,useEffect,useState } from "react";
import type { CollectionDraft,CollectionItem } from "./collection";
const KEY="idoldays.collection.v1";
function read():CollectionItem[]{if(typeof window==="undefined")return[];try{const v=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(v)?v:[]}catch{return[]}}
function write(v:CollectionItem[]){localStorage.setItem(KEY,JSON.stringify(v));}
export function useCollectionSource(){
 const [items,setItems]=useState<CollectionItem[]>([]); const [ready,setReady]=useState(false);
 useEffect(()=>{setItems(read());setReady(true)},[]);
 const addItem=useCallback(async(draft:CollectionDraft)=>{const item:CollectionItem={...draft,id:crypto.randomUUID(),origin:"USER",createdAt:new Date().toISOString()};const next=[item,...read()];write(next);setItems(next);return item},[]);
 const updateItem=useCallback(async(id:string,draft:CollectionDraft)=>{const next=read().map(i=>i.id===id?{...i,...draft}:i);write(next);setItems(next)},[]);
 const removeItem=useCallback(async(id:string)=>{const next=read().filter(i=>i.id!==id);write(next);setItems(next)},[]);
 return {items,ready,addItem,updateItem,removeItem};
}
