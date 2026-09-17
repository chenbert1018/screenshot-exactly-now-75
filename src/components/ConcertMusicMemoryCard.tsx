import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Music2 } from "lucide-react";
import { emptyConcertMusicMemoryDraft, type ConcertMusicMemoryDraft } from "@/lib/concert-music-memory";
import { useConcertMusicMemory } from "@/lib/concert-music-memory.source";
import type { IdolEvent } from "@/lib/events";
import { useIdolMusicSource } from "@/lib/idol-music.source";

function draftFromEntry(entry: ReturnType<typeof useConcertMusicMemory>["entry"]): ConcertMusicMemoryDraft {
  if (!entry) return emptyConcertMusicMemoryDraft;
  return {
    wantToHearSongId: entry.wantToHearSongId, openingSongId: entry.openingSongId,
    finallyHeardSongId: entry.finallyHeardSongId, tearjerkerSongId: entry.tearjerkerSongId,
    hypeSongId: entry.hypeSongId, unforgettableSongId: entry.unforgettableSongId, note: entry.note,
  };
}

function SongSelect({ label, value, onChange, options }: { label: string; value: string | null; onChange: (value: string | null) => void; options: { id: string; title: string; artist: string }[] }) {
  return <label className="block"><span className="text-xs text-muted-foreground">{label}</span><select value={value ?? ""} onChange={(event) => onChange(event.target.value || null)} className="mt-1.5 w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm text-foreground"><option value="">先留白</option>{options.map((song) => <option key={song.id} value={song.id}>{song.title}{song.artist ? ` · ${song.artist}` : ""}</option>)}</select></label>;
}

/** Pre-show hopes and post-show feelings, all saved with the original concert date. */
export function ConcertMusicMemoryCard({ event }: { event: IdolEvent }) {
  const { songs, ready: songsReady } = useIdolMusicSource(event.idolId);
  const { entry, ready, error, save } = useConcertMusicMemory(event);
  const [draft, setDraft] = useState<ConcertMusicMemoryDraft>(emptyConcertMusicMemoryDraft);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => { setDraft(draftFromEntry(entry)); }, [entry?.id, event.id]);
  const set = <K extends keyof ConcertMusicMemoryDraft>(key: K, value: ConcertMusicMemoryDraft[K]) => { setSaved(false); setDraft((current) => ({ ...current, [key]: value })); };
  async function submit() { setSaving(true); setSaveError(""); try { await save(draft); setSaved(true); } catch (error) { setSaveError(error instanceof Error ? error.message : "儲存失敗，請再試一次"); } finally { setSaving(false); } }

  return <section className="mt-8 rounded-[1.9rem] border border-primary/20 bg-primary/5 px-5 py-6 shadow-soft">
    <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-lg">🎤</span><div><p className="text-xs font-medium tracking-[0.13em] text-primary">CONCERT MUSIC MEMORY</p><h3 className="mt-1 font-display text-[18px] font-semibold">MY CONCERT SOUNDTRACK</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">不是 Setlist，是這一場只屬於你的歌。</p></div></div>
    <div className="mt-5 space-y-4">
      {songsReady && songs.length === 0 ? <Link to="/music" className="flex items-center gap-2 rounded-2xl border border-dashed border-primary/35 bg-card/65 px-4 py-3 text-sm text-primary"><Music2 className="size-4" />先到「我們的歌」加入演唱會歌曲</Link> : <>
        <SongSelect label="演唱會前：最想現場聽" value={draft.wantToHearSongId} onChange={(value) => set("wantToHearSongId", value)} options={songs} />
        <div className="border-t border-border/50 pt-4"><p className="mb-3 text-xs font-medium text-primary">演唱會後，慢慢留下</p><div className="space-y-4"><SongSelect label="第一首歌" value={draft.openingSongId} onChange={(value) => set("openingSongId", value)} options={songs} /><SongSelect label="終於現場聽到了" value={draft.finallyHeardSongId} onChange={(value) => set("finallyHeardSongId", value)} options={songs} /><SongSelect label="最好哭" value={draft.tearjerkerSongId} onChange={(value) => set("tearjerkerSongId", value)} options={songs} /><SongSelect label="全場最嗨" value={draft.hypeSongId} onChange={(value) => set("hypeSongId", value)} options={songs} /><SongSelect label="今天最忘不了" value={draft.unforgettableSongId} onChange={(value) => set("unforgettableSongId", value)} options={songs} /></div></div>
      </>}
      <label className="block"><span className="text-xs text-muted-foreground">這場想留的一句話</span><textarea value={draft.note} maxLength={500} onChange={(event) => set("note", event.target.value)} placeholder="唱到這首的時候真的哭了。" className="mt-1.5 min-h-24 w-full resize-none rounded-2xl border border-border/70 bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground" /></label>
    </div>
    {error || saveError ? <p className="mt-3 text-xs text-destructive">{saveError || error}</p> : null}
    <button type="button" disabled={!ready || saving} onClick={() => void submit()} className="mt-5 w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-soft disabled:opacity-50">{saving ? "儲存中…" : saved ? "已收藏這場原聲帶 ♡" : "儲存 Concert Music Memory"}</button>
  </section>;
}
