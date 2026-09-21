import { useEffect, useState } from "react";
import { ArrowRight, Music2, Plus, Share2 } from "lucide-react";
import { emptyComebackDiaryDraft, type ComebackDiaryDraft } from "@/lib/comeback-diary";
import { useComebackDiary } from "@/lib/comeback-diary.source";
import type { IdolEvent } from "@/lib/events";
import { useIdolMusicSource } from "@/lib/idol-music.source";
import { IdolSongFormSheet } from "@/components/IdolSongFormSheet";
import type { IdolSongDraft } from "@/lib/idol-music";
import { shareComebackEraCard } from "@/lib/music-diary-share";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

/** Kept inside the event sheet so each era remains attached to its original D-Day. */
export function ComebackDiaryCard({ event }: { event: IdolEvent }) {
  const {
    songs,
    ready: songsReady,
    addSong,
  } = useIdolMusicSource(event.idolId);

  const { entry, ready, error, save } = useComebackDiary(event);

  const [draft, setDraft] =
    useState<ComebackDiaryDraft>(emptyComebackDiaryDraft);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const [songPickerField, setSongPickerField] =
    useState<
      | "firstFavoriteSongId"
      | "laterFavoriteSongId"
      | "wantToHearLiveSongId"
      | null
    >(null);

  const [addSongOpen, setAddSongOpen] = useState(false);

  useEffect(() => {
    setDraft(draftFromEntry(entry));
  }, [entry?.id, event.id]);

  const set = <K extends keyof ComebackDiaryDraft>(
    key: K,
    value: ComebackDiaryDraft[K],
  ) => {
    setSaved(false);
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const songFields = [
    {
      key: "firstFavoriteSongId" as const,
      label: "第一首喜歡",
    },
    {
      key: "laterFavoriteSongId" as const,
      label: "後來最愛",
    },
    {
      key: "wantToHearLiveSongId" as const,
      label: "最想現場聽",
    },
  ];

  function selectedSongFor(
    key:
      | "firstFavoriteSongId"
      | "laterFavoriteSongId"
      | "wantToHearLiveSongId",
  ) {
    const songId = draft[key];
    return songs.find((song) => song.id === songId);
  }

  function chooseSong(songId: string) {
    if (!songPickerField) return;

    set(songPickerField, songId);
    setSongPickerField(null);
  }

  async function createSongAndChoose(songDraft: IdolSongDraft) {
    if (!songPickerField) {
      throw new Error("沒有正在編輯的歌曲欄位");
    }

    const field = songPickerField;

    try {
      const song = await addSong(songDraft);
      set(field, song.id);
      setSongPickerField(null);
    } catch (cause) {
      setSaveError(
        cause instanceof Error
          ? cause.message
          : "歌曲沒有新增成功，請再試一次",
      );
      throw cause;
    }
  }

  async function shareEra() {
    const eraSongs = songFields.flatMap(({ key, label }) => {
      const song = selectedSongFor(key);
      return song ? [{ label, title: song.title }] : [];
    });

    try {
      await shareComebackEraCard({
        eraTitle: event.title,
        rating: draft.firstListenRating,
        songs: eraSongs,
        note: draft.note || undefined,
      });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setSaveError("Comeback Diary 沒有分享成功，請再試一次");
    }
  }

  async function submit() {
    setSaving(true);
    setSaveError("");

    try {
      await save(draft);
      setSaved(true);
    } catch (cause) {
      setSaveError(
        cause instanceof Error
          ? cause.message
          : "儲存失敗，請再試一次",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-8 rounded-[1.9rem] border border-primary/20 bg-primary/5 px-5 py-6 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-lg">
          💿
        </span>

        <div>
          <p className="text-xs font-medium tracking-[0.13em] text-primary">
            COMEBACK DIARY
          </p>

          <h3 className="mt-1 font-display text-[18px] font-semibold">
            {event.title} ERA ✨
          </h3>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            第一首喜歡和後來最愛可能不同，這才是屬於你的回歸記憶。
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-xs text-muted-foreground">
            第一次聽的感覺
          </p>

          <div
            className="mt-2 flex gap-1.5"
            aria-label="第一次聽的評分"
          >
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                aria-label={`${rating} 顆心`}
                aria-pressed={
                  draft.firstListenRating === rating
                }
                onClick={() =>
                  set(
                    "firstListenRating",
                    draft.firstListenRating === rating
                      ? null
                      : rating,
                  )
                }
                className={`size-9 rounded-full text-base transition-transform active:scale-90 ${
                  rating <= (draft.firstListenRating ?? 0)
                    ? "bg-primary/15"
                    : "bg-card"
                }`}
              >
                {rating <= (draft.firstListenRating ?? 0)
                  ? "💗"
                  : "♡"}
              </button>
            ))}
          </div>
        </div>

        {songFields.map(({ key, label }) => {
          const selectedSong = selectedSongFor(key);

          return (
            <div key={key}>
              <p className="text-xs text-muted-foreground">
                {label}
              </p>

              <button
                type="button"
                disabled={!songsReady}
                onClick={() => setSongPickerField(key)}
                className="mt-1.5 flex w-full items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3 text-left transition-transform active:scale-[0.99] disabled:opacity-50"
              >
                <span className="min-w-0">
                  {selectedSong ? (
                    <>
                      <span className="block truncate text-sm font-medium text-foreground">
                        ♪ {selectedSong.title}
                      </span>

                      {selectedSong.artist ? (
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {selectedSong.artist}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-sm font-medium text-primary">
                      ＋ 選擇歌曲
                    </span>
                  )}
                </span>

                <ArrowRight
                  className="size-4 shrink-0 text-primary"
                  strokeWidth={1.8}
                />
              </button>
            </div>
          );
        })}

        <label className="block">
          <span className="text-xs text-muted-foreground">
            這次 Era 的一句話
          </span>

          <textarea
            value={draft.note}
            maxLength={500}
            onChange={(event) =>
              set("note", event.target.value)
            }
            placeholder="第一次聽的心情，留給以後的自己…"
            className="mt-1.5 min-h-24 w-full resize-none rounded-2xl border border-border/70 bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </label>
      </div>

      {error || saveError ? (
        <p className="mt-3 text-xs text-destructive">
          {saveError || error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={!ready || saving}
        onClick={() => void submit()}
        className="mt-5 min-h-[52px] w-full rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-soft transition-transform active:scale-[0.97] disabled:opacity-50"
      >
        {saving
          ? "儲存中…"
          : saved
            ? "已收藏這個 Era ♡"
            : "儲存 Comeback Diary"}
      </button>

      <button
        type="button"
        onClick={() => void shareEra()}
        className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-card px-4 py-2.5 text-xs font-medium text-primary shadow-soft transition-transform active:scale-[0.97]"
      >
        <Share2 className="size-3.5" strokeWidth={1.8} />
        分享我的 Era ♡
      </button>

      <Sheet
        open={songPickerField !== null}
        onOpenChange={(open) => {
          if (!open && !addSongOpen) {
            setSongPickerField(null);
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[78vh] max-w-md overflow-y-auto rounded-t-[2rem] border-border/70 bg-background px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="font-display text-[22px]">
              選擇歌曲 ♡
            </SheetTitle>

            <SheetDescription>
              {songPickerField
                ? songFields.find(
                    (item) =>
                      item.key === songPickerField,
                  )?.label
                : "Comeback Diary"}
            </SheetDescription>
          </SheetHeader>

          {songs.length > 0 ? (
            <div className="mt-5 space-y-2">
              {songs.map((song) => {
                const active =
                  songPickerField !== null &&
                  draft[songPickerField] === song.id;

                return (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => chooseSong(song.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-transform active:scale-[0.99] ${
                      active
                        ? "border-primary/50 bg-primary/10"
                        : "border-border/70 bg-card/80"
                    }`}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      ♪
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {song.title}
                      </span>

                      {song.artist ? (
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {song.artist}
                        </span>
                      ) : null}
                    </span>

                    {active ? (
                      <span className="shrink-0 text-xs font-medium text-primary">
                        已選擇 ♡
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-surface/60 px-4 py-5 text-center">
              <Music2
                className="mx-auto size-6 text-primary"
                strokeWidth={1.5}
              />

              <p className="mt-2 text-sm font-medium">
                這個 Era 還沒有收藏歌曲 ♡
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                可以直接從這裡加入第一首歌。
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setAddSongOpen(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
          >
            <Plus className="size-4" strokeWidth={2} />
            新增歌曲
          </button>
        </SheetContent>
      </Sheet>

      <IdolSongFormSheet
        open={addSongOpen}
        onOpenChange={setAddSongOpen}
        onSubmit={createSongAndChoose}
      />
    </section>
  );
}
