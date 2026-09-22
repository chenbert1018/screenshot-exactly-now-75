import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Heart,Plus,X } from "lucide-react";
import { AppShell,PageHeader,SoftCard } from "@/components/AppShell";
import { COLLECTION_CATEGORIES,collectionCategoryMeta,type CollectionCategory } from "@/lib/collection";
import { useCollectionSource } from "@/lib/collection.source";
import { useIdolSource } from "@/lib/idols.source";

export const Route=createFileRoute("/collection")({component:CollectionPage});
function CollectionPage(){
 const {items,ready,addItem}=useCollectionSource(); const {idols,homeIdol}=useIdolSource();
 const [open,setOpen]=useState(false); const [category,setCategory]=useState<CollectionCategory>("ALBUM");
 const [title,setTitle]=useState(""); const [date,setDate]=useState(""); const [source,setSource]=useState(""); const [note,setNote]=useState("");
 const submit=async()=>{if(!title.trim())return;await addItem({idolId:homeIdol?.id,category,title:title.trim(),photo:undefined,acquiredDate:date||undefined,source:source.trim()||undefined,note:note.trim()||undefined,favorite:false});setTitle("");setDate("");setSource("");setNote("");setOpen(false)};
 return <AppShell>
  <PageHeader title="我的收藏" subtitle="喜歡他的日子，也慢慢變成了這些收藏 ♡" />
  <section className="mb-6 grid grid-cols-3 gap-2">
   {COLLECTION_CATEGORIES.map(k=>{const m=collectionCategoryMeta[k],n=items.filter(i=>i.category===k).length;return <SoftCard key={k} className="px-3 py-4 text-center"><div className="text-2xl">{m.emoji}</div><p className="mt-2 text-sm font-medium">{m.label}</p><p className="mt-1 text-[13px] text-muted-foreground">{n}</p></SoftCard>})}
  </section>
  <button type="button" onClick={()=>setOpen(true)} className="mb-6 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-base font-medium text-primary-foreground active:scale-[.98]"><Plus className="size-4"/>留下新的收藏</button>
  {!ready?<div className="h-32 rounded-3xl bg-surface/50"/>:items.length===0?<SoftCard className="px-5 py-8 text-center"><p className="font-display text-[19px]">第一件收藏，從喜歡開始 ♡</p><p className="mt-2 text-sm text-muted-foreground">專輯、小卡、票根或一件捨不得丟掉的周邊，都可以留在這裡。</p></SoftCard>:<div className="space-y-3">{items.map(i=>{const m=collectionCategoryMeta[i.category];const idol=i.idolId?idols.find(x=>x.id===i.idolId):undefined;return <SoftCard key={i.id} className="px-5 py-4"><div className="flex gap-3"><span className="text-2xl">{m.emoji}</span><div className="min-w-0 flex-1"><p className="text-base font-medium">{i.title}</p><p className="mt-1 text-sm text-muted-foreground">{[m.label,idol?.name,i.acquiredDate].filter(Boolean).join(" · ")}</p>{i.note?<p className="mt-2 text-sm leading-relaxed">{i.note}</p>:null}</div>{i.favorite?<Heart className="size-4 fill-current text-primary"/>:null}</div></SoftCard>})}</div>}
  {open?<div className="fixed inset-0 z-[90] flex items-end bg-black/20" onClick={()=>setOpen(false)}><div className="w-full rounded-t-[2rem] bg-card px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-xl" onClick={e=>e.stopPropagation()}><div className="mb-4 flex items-center justify-between"><div><p className="text-[13px] font-semibold tracking-[.14em] text-primary">MY COLLECTION ♡</p><h2 className="mt-1 font-display text-[20px] font-semibold">留下新的收藏</h2></div><button onClick={()=>setOpen(false)} className="flex size-11 items-center justify-center"><X className="size-5"/></button></div>
   <div className="mb-4 flex gap-2 overflow-x-auto pb-1">{COLLECTION_CATEGORIES.map(k=><button key={k} onClick={()=>setCategory(k)} className={`shrink-0 rounded-full px-3 py-2 text-sm ${category===k?"bg-primary text-primary-foreground":"bg-surface"}`}>{collectionCategoryMeta[k].emoji} {collectionCategoryMeta[k].label}</button>)}</div>
   <div className="space-y-3"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="收藏名稱" className="min-h-[50px] w-full rounded-2xl bg-surface px-4 text-base outline-none"/><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="min-h-[50px] w-full rounded-2xl bg-surface px-4 text-base outline-none"/><input value={source} onChange={e=>setSource(e.target.value)} placeholder="在哪裡得到的？（選填）" className="min-h-[50px] w-full rounded-2xl bg-surface px-4 text-base outline-none"/><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="想替這件收藏留一句話嗎？（選填）" className="min-h-24 w-full rounded-2xl bg-surface px-4 py-3 text-base outline-none"/></div>
   <button disabled={!title.trim()} onClick={()=>void submit()} className="mt-5 min-h-[52px] w-full rounded-full bg-primary px-5 text-base font-medium text-primary-foreground disabled:opacity-40">收進我的收藏 ♡</button>
  </div></div>:null}
 </AppShell>
}
