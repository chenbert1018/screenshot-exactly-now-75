import { useEffect, useState } from "react";
import { ArrowRight, Music2, Plus } from "lucide-react";

import { IdolSongFormSheet } from "@/components/IdolSongFormSheet";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  emptyConcertMusicMemoryDraft,
  type ConcertMusicMemoryDraft,
} from "@/lib/concert-music-memory";

import { useConcertMusicMemory } from "@/lib/concert-music-memory.source";
import type { IdolEvent } from "@/lib/events";
import type { IdolSongDraft } from "@/lib/idol-music";
import { useIdolMusicSource } from "@/lib/idol-music.source";

type ConcertSongField =
  | "wantToHearSongId"
  | "openingSongId"
  | "finallyHeardSongId"
  | "tearjerkerSongId"
  | "hypeSongId"
  | "unforgettableSongId";

const SONG_FIELDS: {
  key: ConcertSongField;
  label: string;
  section: "before" | "after";
}[] = [
  {
    key: "wantToHearSongId",
    label: "演唱會前：最想現場聽",
    section: "before",
  },
  {
    key: "openingSongId",
    label: "第一首歌",
    section: "after",
  },
  {
    key: "finallyHeardSongId",
    label: "終於現場聽到了",
    section: "after",
  },
  {
    key: "tearjerkerSongId",
    label: "最好哭",
    section: "after",
  },
  {
    key: "hypeSongId",
    label: "全場最嗨",
    section: "after",
  },
  {
    key: "unforgettableSongId",
    label: "今天最忘不了",
    section: "after",
  },
];

function draftFromEntry(
  entry: ReturnType<typeof useConcertMusicMemory>["entry"],
): ConcertMusicMemoryDraft {
  if (!entry) return emptyConcertMusicMemoryDraft;

  return {
    wantToHearSongId: entry.wantToHearSongId,
    openingSongId: entry.openingSongId,
    finallyHeardSongId: entry.finallyHeardSongId,
    tearjerkerSongId: entry.tearjerkerSongId,
    hypeSongId: entry.hypeSongId,
    unforgettableSongId: entry.unforgettableSongId,
    note: entry.note,
  };
}

/** Pre-show hopes and post-show feelings, all saved with the original concert date. */
export function ConcertMusicMemoryCard({
  event,
}: {
  event: IdolEvent;
}) {
  const {
    songs,
    ready: songsReady,
    addSong,
  } = useIdolMusicSource(event.idolId);

  const {
    entry,
    ready,
    error,
    save,
  } = useConcertMusicMemory(event);

  const [draft, setDraft] =
    useState<ConcertMusicMemoryDraft>(
      emptyConcertMusicMemoryDraft,
    );

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const [songPickerField, setSongPickerField] =
    useState<ConcertSongField | null>(null);

  const [addSongOpen, setAddSongOpen] = useState(false);

  useEffect(() => {
    setDraft(draftFromEntry(entry));
  }, [entry?.id, event.id]);

  const set = <K extends keyof ConcertMusicMemoryDraft>(
    key: K,
    value: ConcertMusicMemoryDraft[K],
  ) => {
    setSaved(false);
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  function selectedSongFor(key: ConcertSongField) {
    const songId = draft[key];
    return songs.find((song) => song.id === songId);
  }

  function chooseSong(songId: string) {
    if (!songPickerField) return;

    set(songPickerField, songId);
    setSongPickerField(null);
  }

  async function createSongAndChoose(
    songDraft: IdolSongDraft,
  ) {
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

  function SongField({
    field,
  }: {
    field: (typeof SONG_FIELDS)[number];
  }) {
    const selectedSong = selectedSongFor(field.key);

    return (
      <div>
        <p className="text-xs text-muted-foreground">
          {field.label}
        </p>

        <button
          type="button"
          disabled={!songsReady}
          onClick={() => setSongPickerField(field.key)}
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
  }

  const activeField = SONG_FIELDS.find(
    (field) => field.key === songPickerField,
  );

  return (
    <section className="mt-8 rounded-[1.9rem] border border-primary/20 bg-primary/5 px-5 py-6 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-lg">
          🎤
        </span>

        <div>
          <p className="text-xs font-medium tracking-[0.13em] text-primary">
            CONCERT MUSIC MEMORY
          </p>

          <h3 className="mt-1 font-display text-[18px] font-semibold">
            MY CONCERT SOUNDTRACK
          </h3>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            不是 Setlist，是這一場只屬於你的歌。
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {SONG_FIELDS
          .filter((field) => field.section === "before")
          .map((field) => (
            <SongField
              key={field.key}
              field={field}
            />
          ))}

        <div className="border-t border-border/50 pt-4">
          <p className="mb-3 text-xs font-medium text-primary">
            演唱會後，慢慢留下
          </p>

          <div className="space-y-4">
            {SONG_FIELDS
              .filter((field) => field.section === "after")
              .map((field) => (
                <SongField
                  key={field.key}
                  field={field}
                />
              ))}
          </div>
        </div>

        <label className="block">
          <span className="text-xs text-muted-foreground">
            這場想留的一句話
          </span>

          <textarea
            value={draft.note}
            maxLength={500}
            onChange={(event) =>
              set("note", event.target.value)
            }
            placeholder="唱到這首的時候真的哭了。"
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
        className="mt-5 w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-soft disabled:opacity-50"
      >
        {saving
          ? "儲存中…"
          : saved
            ? "已收藏這場原聲帶 ♡"
            : "儲存 Concert Music Memory"}
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
              {activeField?.label ??
                "Concert Music Memory"}
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
                這場演唱會還沒有收藏歌曲 ♡
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
            <Plus
              className="size-4"
              strokeWidth={2}
            />
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
