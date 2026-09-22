import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import type { IdolEvent } from "@/lib/events";
import { emptyConcertPersonalMemoryDraft } from "@/lib/concert-personal-memory";
import { useConcertPersonalMemory } from "@/lib/concert-personal-memory.source";

export function ConcertPersonalMemoryCard({ event }: { event: IdolEvent }) {
  const { entry, ready, save } = useConcertPersonalMemory(event.id);
  const [seat, setSeat] = useState("");
  const [moment, setMoment] = useState("");
  const [photo, setPhoto] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const draft = entry ?? emptyConcertPersonalMemoryDraft;
    setSeat(draft.seat ?? "");
    setMoment(draft.unforgettableMoment ?? "");
    setPhoto(draft.photo ?? "");
  }, [entry?.eventId]);

  const dirty = () => setSaved(false);
  const choosePhoto = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setPhoto(typeof reader.result === "string" ? reader.result : ""); dirty(); };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setSaving(true);
    try {
      await save({ seat, unforgettableMoment: moment, photo });
      setSaved(true);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (entry && !editing) {
    return (
      <section className="mt-5 overflow-hidden rounded-[1.9rem] border border-border/70 bg-card/90 shadow-soft">
        {entry.photo ? <img src={entry.photo} alt="演唱會現場回憶" className="aspect-[16/9] w-full object-cover" /> : null}
        <div className="px-5 py-5">
          <p className="text-[12px] font-semibold tracking-[0.14em] text-primary">演唱會回憶 ♡</p>
          <h3 className="mt-1 font-display text-[20px] font-semibold">那一天，我真的在台下。</h3>
          {entry.seat ? <p className="mt-3 text-sm text-muted-foreground">🎫 {entry.seat}</p> : null}
          {entry.unforgettableMoment ? <p className="mt-3 text-[15px] leading-relaxed">「{entry.unforgettableMoment}」</p> : null}
          <button type="button" onClick={()=>setEditing(true)} className="mt-4 inline-flex min-h-11 items-center rounded-full px-1 text-sm font-medium text-primary transition-transform active:scale-95">編輯這天的回憶</button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-[1.9rem] border border-border/70 bg-card/85 px-5 py-6 shadow-soft">
      <p className="text-[12px] font-semibold tracking-[0.14em] text-primary">我在現場 ♡</p>
      <h3 className="mt-1 font-display text-[19px] font-semibold">我真的和他一起度過了這一天。</h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">先留下一張照片和最忘不了的一刻就好 ♡</p>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="text-xs text-muted-foreground">我坐在哪裡？（選填）</span>
          <input value={seat} onChange={(e)=>{setSeat(e.target.value);dirty()}} placeholder="例：A3 區 12 排 8 號" className="mt-1.5 min-h-[50px] w-full rounded-2xl bg-surface px-4 text-base outline-none" />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">這場最忘不了的一刻</span>
          <textarea value={moment} onChange={(e)=>{setMoment(e.target.value);dirty()}} maxLength={500} placeholder="他走到延伸台看向這邊的時候，我真的忘記呼吸了。" className="mt-1.5 min-h-24 w-full resize-none rounded-2xl bg-surface px-4 py-3 text-base outline-none" />
        </label>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e)=>choosePhoto(e.target.files?.[0])} />
        <button type="button" onClick={()=>inputRef.current?.click()} className="flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-[1.5rem] bg-surface active:scale-[.99]">
          {photo ? <img src={photo} alt="演唱會現場回憶" className="size-full object-cover" /> : <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground"><Camera className="size-6" strokeWidth={1.6}/>留一張那天的照片</span>}
        </button>
      </div>

      <button type="button" disabled={!ready || saving} onClick={()=>void submit()} className="mt-5 min-h-[52px] w-full rounded-full bg-primary px-5 text-base font-medium text-primary-foreground shadow-soft transition-transform active:scale-[0.98] disabled:opacity-50">
        {saving ? "儲存中…" : saved ? "這一天收好了 ♡" : "把這一天收進 IdolDays ♡"}
      </button>
    </section>
  );
}
