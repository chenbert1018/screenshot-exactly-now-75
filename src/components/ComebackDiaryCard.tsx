import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Music2 } from "lucide-react";
import { emptyComebackDiaryDraft, type ComebackDiaryDraft } from "@/lib/comeback-diary";
import { useComebackDiary } from "@/lib/comeback-diary.source";
import type { IdolEvent } from "@/lib/events";
import { useIdolMusicSource } from "@/lib/idol-music.source";

function draftFromEntry(entry: ReturnType<typeof useComebackDiary>["entry"]): ComebackDiaryDraft {
  if (!entry) return emptyComebackDiaryDraft;
  return {
    firstListenRating: entry.firstListenRating,
    firstFavoriteSongId: entry.firstFavoriteSongId,
    laterFavoriteSongId: entry.laterFavoriteSongId,
    wantToHearLiveSongId: entry.wantToHearLiveSongId,
    note: entry.note,
  };
}

function SongSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: { id: string; title: string; artist: string }[];
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        className="mt-1.5 w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm text-foreground"
      >
        <option value="">先留白</option>
        {options.map((song) => <option key={song.id} value={song.id}>{song.title}{song.artist ? ` · ${song.artist}` : ""}</option>)}
      </select>
    </label>
  );
}

/** Kept inside the event sheet so each era remains attached to its original D-Day. */
export function ComebackDiaryCard({ event }: { event: IdolEvent }) {
  const { songs, ready: songsReady } = useIdolMusicSource(event.idolId);
  const { entry, ready, error, save } = useComebackDiary(event);
  const [draft, setDraft] = useState<ComebackDiaryDraft>(emptyComebackDiaryDraft);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => { setDraft(draftFromEntry(entry)); }, [entry?.id, event.id]);

  const set = <K extends keyof ComebackDiaryDraft>(key: K, value: ComebackDiaryDraft[K]) => {
    setSaved(false);
    setDraft((current) => ({ ...current, [key]: value }));
  };

  async function submit() {
    setSaving(true);
    setSaveError("");
    try {
      await save(draft);
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "儲存失敗，請再試一次");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-8 rounded-[1.9rem] border border-primary/20 bg-primary/5 px-5 py-6 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-lg">💿</span>
        <div>
          <p className="text-xs font-medium tracking-[0.13em] text-primary">COMEBACK DIARY</p>
          <h3 className="mt-1 font-display text-[18px] font-semibold">{event.title} ERA ✨</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">第一首喜歡和後來最愛可能不同，這才是屬於你的回歸記憶。</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-xs text-muted-foreground">第一次聽的感覺</p>
          <div className="mt-2 flex gap-1.5" aria-label="第一次聽的評分">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                aria-label={`${rating} 顆心`}
                aria-pressed={draft.firstListenRating === rating}
                onClick={() => set("firstListenRating", draft.firstListenRating === rating ? null : rating)}
                className={`size-9 rounded-full text-base transition-transform active:scale-90 ${rating <= (draft.firstListenRating ?? 0) ? "bg-primary/15" : "bg-card"}`}
              >
                {rating <= (draft.firstListenRating ?? 0) ? "💗" : "♡"}
              </button>
            ))}
          </div>
        </div>

        {songsReady && songs.length === 0 ? (
          <Link to="/music" className="flex items-center gap-2 rounded-2xl border border-dashed border-primary/35 bg-card/65 px-4 py-3 text-sm text-primary">
            <Music2 className="size-4" /> 先到「我們的歌」加入這張專輯的歌曲
          </Link>
        ) : (
          <>
            <SongSelect label="第一首喜歡" value={draft.firstFavoriteSongId} onChange={(value) => set("firstFavoriteSongId", value)} options={songs} />
            <SongSelect label="後來最愛" value={draft.laterFavoriteSongId} onChange={(value) => set("laterFavoriteSongId", value)} options={songs} />
            <SongSelect label="最想現場聽" value={draft.wantToHearLiveSongId} onChange={(value) => set("wantToHearLiveSongId", value)} options={songs} />
          </>
        )}

        <label className="block">
          <span className="text-xs text-muted-foreground">這次 Era 的一句話</span>
          <textarea value={draft.note} maxLength={500} onChange={(event) => set("note", event.target.value)} placeholder="第一次聽的心情，留給以後的自己…" className="mt-1.5 min-h-24 w-full resize-none rounded-2xl border border-border/70 bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground" />
        </label>
      </div>

      {error || saveError ? <p className="mt-3 text-xs text-destructive">{saveError || error}</p> : null}
      <button type="button" disabled={!ready || saving} onClick={() => void submit()} className="mt-5 w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-soft disabled:opacity-50">
        {saving ? "儲存中…" : saved ? "已收藏這個 Era ♡" : "儲存 Comeback Diary"}
      </button>
    </section>
  );
}
