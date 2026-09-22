import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import type { IdolEvent } from "@/lib/events";
import { emptyMeetMemoryDraft } from "@/lib/meet-memory";
import { useMeetMemory } from "@/lib/meet-memory.source";

export function MeetMemoryCard({ event }: { event: IdolEvent }) {
  const { entry, ready, save } = useMeetMemory(event.id);
  const [wantedToSay, setWantedToSay] = useState("");
  const [actuallySaid, setActuallySaid] = useState("");
  const [idolMoment, setIdolMoment] = useState("");
  const [afterthought, setAfterthought] = useState("");
  const [photo, setPhoto] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const draft = entry ?? emptyMeetMemoryDraft;
    setWantedToSay(draft.wantedToSay ?? "");
    setActuallySaid(draft.actuallySaid ?? "");
    setIdolMoment(draft.idolMoment ?? "");
    setAfterthought(draft.afterthought ?? "");
    setPhoto(draft.photo ?? "");
  }, [entry?.eventId]);

  const change = (setter: (value: string) => void) => (value: string) => { setter(value); setSaved(false); };
  const choosePhoto = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setPhoto(typeof reader.result === "string" ? reader.result : ""); setSaved(false); };
    reader.readAsDataURL(file);
  };
  const submit = async () => {
    setSaving(true);
    try {
      await save({ wantedToSay, actuallySaid, idolMoment, afterthought, photo });
      setSaved(true);
    } finally { setSaving(false); }
  };

  return (
    <section className="mt-8 rounded-[1.9rem] border border-primary/20 bg-primary/5 px-5 py-6 shadow-soft">
      <p className="text-[12px] font-semibold tracking-[0.14em] text-primary">MEET DIARY ♡</p>
      <h3 className="mt-1 font-display text-[19px] font-semibold">我真的見到他了。</h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">不是活動紀錄，是只屬於你們那一天的幾個瞬間。</p>

      <div className="mt-5 space-y-4">
        <label className="block"><span className="text-xs text-muted-foreground">見面前，最想對他說什麼？</span><textarea value={wantedToSay} onChange={(e)=>change(setWantedToSay)(e.target.value)} maxLength={300} placeholder="一直想告訴你的那句話…" className="mt-1.5 min-h-20 w-full resize-none rounded-2xl bg-background px-4 py-3 text-base outline-none"/></label>
        <label className="block"><span className="text-xs text-muted-foreground">最後真的說了什麼？</span><textarea value={actuallySaid} onChange={(e)=>change(setActuallySaid)(e.target.value)} maxLength={300} placeholder="輪到我的時候，最後說出口的是…" className="mt-1.5 min-h-20 w-full resize-none rounded-2xl bg-background px-4 py-3 text-base outline-none"/></label>
        <label className="block"><span className="text-xs text-muted-foreground">他做了什麼，讓我一直記得？ ♡</span><textarea value={idolMoment} onChange={(e)=>change(setIdolMoment)(e.target.value)} maxLength={400} placeholder="一個眼神、一句話、一個動作都可以。" className="mt-1.5 min-h-24 w-full resize-none rounded-2xl bg-background px-4 py-3 text-base outline-none"/></label>
        <label className="block"><span className="text-xs text-muted-foreground">回家後，最想留下的一句話</span><textarea value={afterthought} onChange={(e)=>change(setAfterthought)(e.target.value)} maxLength={300} placeholder="原來真的見到你的那一天，是這種感覺。" className="mt-1.5 min-h-20 w-full resize-none rounded-2xl bg-background px-4 py-3 text-base outline-none"/></label>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e)=>choosePhoto(e.target.files?.[0])}/>
        <button type="button" onClick={()=>inputRef.current?.click()} className="flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-[1.5rem] bg-background active:scale-[.99]">
          {photo ? <img src={photo} alt="Fan Meeting 回憶" className="size-full object-cover"/> : <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground"><Camera className="size-6" strokeWidth={1.6}/>留一張那天的照片</span>}
        </button>
      </div>
      <button type="button" disabled={!ready||saving} onClick={()=>void submit()} className="mt-5 min-h-[50px] w-full rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving?"儲存中…":saved?"見到你的這一天收好了 ♡":"把見到你的這一天收起來 ♡"}</button>
    </section>
  );
}
