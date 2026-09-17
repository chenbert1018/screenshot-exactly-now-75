import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Library,
  Music2,
  Plus,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  AppShell,
  EmptyState,
  SoftCard,
} from "@/components/AppShell";
import { IdolSongFormSheet } from "@/components/IdolSongFormSheet";
import { MusicTimeline } from "@/components/MusicTimeline";
import { YearInMusicCard } from "@/components/YearInMusicCard";
import { MonthlyMusicCard } from "@/components/MonthlyMusicCard";

import {
  SONG_ROLE_OPTIONS,
  streamingLink,
  type SongRole,
} from "@/lib/idol-music";
import { useIdolMusicSource } from "@/lib/idol-music.source";
import { useIdolSource } from "@/lib/idols.source";
import { shareSoundtrackCard } from "@/lib/soundtrack-share";
import { useSongJournalHistory } from "@/lib/idol-song-journal.source";
import { useComebackDiaryHistory } from "@/lib/comeback-diary.source";
import { useConcertMusicMemoryHistory } from "@/lib/concert-music-memory.source";
import { buildMusicTimeline } from "@/lib/music-timeline";
import { useEventSource } from "@/lib/events.source";

export const Route = createFileRoute("/music")({
  component: MusicPage,
});

function MusicPage() {
  const {
    homeIdol,
    ready: idolsReady,
  } = useIdolSource();

  const {
    songs,
    roles,
    ready,
    error,
    addSong,
    setTodayPick,
    assignRole,
    removeSong,
  } = useIdolMusicSource(homeIdol?.id);

  const songHistory =
    useSongJournalHistory(homeIdol?.id);

  const comebackHistory =
    useComebackDiaryHistory(homeIdol?.id);

  const concertHistory =
    useConcertMusicMemoryHistory(homeIdol?.id);

  const eventSource = useEventSource();

  const timelineEvents = useMemo(
    () =>
      eventSource.events.filter(
        (event) =>
          event.idolId === homeIdol?.id,
      ),
    [
      eventSource.events,
      homeIdol?.id,
    ],
  );

  const timelineItems = useMemo(
    () =>
      buildMusicTimeline({
        songs,
        journalEntries:
          songHistory.entries,
        comebackDiaries:
          comebackHistory.entries,
        concertMemories:
          concertHistory.entries,
        events: timelineEvents,
      }),
    [
      songs,
      songHistory.entries,
      comebackHistory.entries,
      concertHistory.entries,
      timelineEvents,
    ],
  );

  const timelineReady =
    songHistory.ready &&
    comebackHistory.ready &&
    concertHistory.ready &&
    eventSource.ready;

  const [open, setOpen] =
    useState(false);

  const [libraryOpen, setLibraryOpen] =
    useState(false);

  const [soundtrackOpen, setSoundtrackOpen] =
    useState(false);

  const [memoriesOpen, setMemoriesOpen] =
    useState(false);

  const [busy, setBusy] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [sharing, setSharing] =
    useState(false);

  const today = songs.find(
    (song) => song.isTodayPick,
  );

  const roleSong = (
    role: SongRole,
  ) =>
    songs.find(
      (song) =>
        song.id ===
        roles.find(
          (item) =>
            item.role === role,
        )?.songId,
    );

  const run = async (
    key: string,
    action: () => Promise<void>,
  ) => {
    setBusy(key);
    setActionError("");

    try {
      await action();
    } catch {
      setActionError(
        "沒有儲存成功，請確認網路後再試一次",
      );
    } finally {
      setBusy("");
    }
  };

  const share = async () => {
    if (!homeIdol) return;

    setSharing(true);
    setActionError("");

    try {
      await shareSoundtrackCard(
        homeIdol.name || "MY IDOL",
        SONG_ROLE_OPTIONS.map(
          ([role]) => ({
            role,
            song: roleSong(role),
          }),
        ),
      );
    } catch {
      setActionError(
        "分享卡建立失敗，請再試一次。",
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <AppShell>
      <header className="mb-7">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
          My Music
        </p>

        <h1 className="mt-2 font-display text-[27px] font-medium">
          我和他的歌 🎧
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          喜歡一個人的日子，
          <br />
          總會留下幾首歌。
        </p>
      </header>

      {!idolsReady ? (
        <div className="h-40 rounded-3xl bg-surface/50" />
      ) : !homeIdol ? (
        <EmptyState
          icon={
            <Music2 className="size-5" />
          }
          title="先選一位本命偶像"
          description="歌曲會和偶像、回憶一起保存。"
          action={
            <Link
              to="/idols"
              className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
            >
              前往偶像
            </Link>
          }
        />
      ) : (
        <>
          {/* TODAY */}
          <SectionLabel
            eyebrow="TODAY ♡"
            title="今天和他一起聽什麼？"
          />

          <section className="rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/15 via-card to-accent/25 p-5 shadow-soft">
            <p className="text-[10px] font-medium tracking-[0.16em] text-primary">
              TODAY'S SONG
            </p>

            <p className="mt-3 font-display text-[22px] font-semibold">
              {today?.title ||
                "今天想聽哪一首？"}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {today?.artist ||
                "選一首歌，讓今天也有專屬 BGM。"}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setLibraryOpen(true)
                }
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              >
                <Music2 className="size-4" />
                {today
                  ? "換一首歌"
                  : "選一首歌"}
              </button>

              {today &&
              streamingLink(today) ? (
                <a
                  href={
                    streamingLink(today)
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-4 py-2.5 text-sm text-foreground"
                >
                  播放
                  <ExternalLink className="size-3.5" />
                </a>
              ) : null}
            </div>
          </section>

          {actionError || error ? (
            <p
              role="alert"
              className="mt-3 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {actionError ||
                "歌曲資料暫時讀取失敗，請稍後再試。"}
            </p>
          ) : null}

          {/* LIBRARY */}
          <section className="mt-4">
            <button
              type="button"
              onClick={() =>
                setLibraryOpen(
                  (value) => !value,
                )
              }
              className="flex w-full items-center gap-3 rounded-[1.5rem] bg-surface/55 px-4 py-3.5 text-left"
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Library className="size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  我的歌曲
                </p>

                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {songs.length > 0
                    ? `已留下 ${songs.length} 首歌`
                    : "把喜歡的歌收藏進 IdolDays"}
                </p>
              </div>

              {libraryOpen ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>

            {libraryOpen ? (
              <div className="mt-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    選擇今天的歌或管理收藏
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setOpen(true)
                    }
                    className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground"
                  >
                    <Plus className="size-3.5" />
                    加入歌曲
                  </button>
                </div>

                {!ready ? (
                  <div className="h-36 rounded-3xl bg-surface/50" />
                ) : songs.length === 0 ? (
                  <EmptyState
                    icon={
                      <Music2 className="size-5" />
                    }
                    title="還沒有第一首歌"
                    description="把入坑曲、最愛或最近循環加進來。"
                    action={
                      <button
                        type="button"
                        onClick={() =>
                          setOpen(true)
                        }
                        className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
                      >
                        加入第一首歌
                      </button>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {songs.map(
                      (song) => (
                        <SoftCard
                          key={song.id}
                          className="p-4"
                        >
                          <div className="flex gap-3">
                            <Music2 className="mt-0.5 size-5 shrink-0 text-primary" />

                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">
                                {song.title}
                              </p>

                              <p className="mt-1 truncate text-sm text-muted-foreground">
                                {[
                                  song.artist,
                                  song.album,
                                ]
                                  .filter(Boolean)
                                  .join(" · ") ||
                                  "我的歌"}
                              </p>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={Boolean(
                                    busy,
                                  )}
                                  onClick={() =>
                                    void run(
                                      `today-${song.id}`,
                                      () =>
                                        setTodayPick(
                                          song.id,
                                        ),
                                    )
                                  }
                                  className={`rounded-full px-3 py-1.5 text-xs ${
                                    song.isTodayPick
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-surface text-muted-foreground"
                                  }`}
                                >
                                  {song.isTodayPick
                                    ? "今日播放中"
                                    : "設為今日歌曲"}
                                </button>

                                {streamingLink(
                                  song,
                                ) ? (
                                  <a
                                    href={streamingLink(
                                      song,
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-full bg-surface px-3 py-1.5 text-xs text-muted-foreground"
                                  >
                                    播放 ↗
                                  </a>
                                ) : null}
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={Boolean(
                                busy,
                              )}
                              aria-label={`刪除 ${song.title}`}
                              onClick={() =>
                                void run(
                                  `delete-${song.id}`,
                                  () =>
                                    removeSong(
                                      song.id,
                                    ),
                                )
                              }
                              className="p-1 text-muted-foreground"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </SoftCard>
                      ),
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </section>

          {/* MEMORIES */}
          <SectionDivider />

          <SectionLabel
            eyebrow="OUR MEMORIES ♡"
            title="我們留下的音樂記憶"
            description="有些歌一響起，就會回到那一天。"
          />

          <button
            type="button"
            onClick={() =>
              setMemoriesOpen(
                (value) => !value,
              )
            }
            className="flex w-full items-center gap-3 rounded-[1.6rem] border border-border/60 bg-card/75 px-4 py-4 text-left shadow-soft"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Music2 className="size-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-medium">
                Music Timeline
              </p>

              <p className="mt-1 text-[11px] text-muted-foreground">
                Today's Song · Comeback ·
                Concert
              </p>
            </div>

            {memoriesOpen ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </button>

          {memoriesOpen ? (
            <MusicTimeline
              items={timelineItems}
              ready={timelineReady}
            />
          ) : null}

          {/* RECAP */}
          <SectionDivider />

          <SectionLabel
            eyebrow="RECAP ♡"
            title="我們的音樂回顧"
            description="一個月、一整年，原來都有自己的 BGM。"
          />

          <MonthlyMusicCard
            idolName={
              homeIdol.name || "他"
            }
            items={timelineItems}
            ready={timelineReady}
          />

          <YearInMusicCard
            idolName={
              homeIdol.name || "他"
            }
            items={timelineItems}
            ready={timelineReady}
          />

          {/* OUR SOUNDTRACK */}
          {songs.length > 0 ? (
            <>
              <SectionDivider />

              <section>
                <button
                  type="button"
                  onClick={() =>
                    setSoundtrackOpen(
                      (value) => !value,
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-[1.6rem] bg-surface/55 px-4 py-4 text-left"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="size-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[15px] font-medium">
                      六首只屬於我們的歌
                    </p>

                    <p className="mt-1 text-[11px] text-muted-foreground">
                      MY IDOL SOUNDTRACK ♡
                    </p>
                  </div>

                  {soundtrackOpen ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </button>

                {soundtrackOpen ? (
                  <div className="mt-4">
                    <div className="mb-3 flex justify-end">
                      <button
                        type="button"
                        disabled={sharing}
                        onClick={() =>
                          void share()
                        }
                        className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
                      >
                        <Share2 className="size-3.5" />
                        {sharing
                          ? "建立中…"
                          : "分享卡"}
                      </button>
                    </div>

                    <div className="space-y-2">
                      {SONG_ROLE_OPTIONS.map(
                        ([role, label]) => {
                          const song =
                            roleSong(role);

                          return (
                            <div
                              key={role}
                              className="rounded-2xl bg-surface/60 px-4 py-3"
                            >
                              <label className="block text-xs text-muted-foreground">
                                {label}
                              </label>

                              <select
                                value={
                                  song?.id ||
                                  ""
                                }
                                disabled={Boolean(
                                  busy,
                                )}
                                onChange={(
                                  event,
                                ) =>
                                  event.target
                                    .value &&
                                  void run(
                                    `role-${role}`,
                                    () =>
                                      assignRole(
                                        role,
                                        event
                                          .target
                                          .value,
                                      ),
                                  )
                                }
                                className="mt-1 w-full bg-transparent text-sm outline-none"
                              >
                                <option value="">
                                  選一首歌
                                </option>

                                {songs.map(
                                  (item) => (
                                    <option
                                      key={
                                        item.id
                                      }
                                      value={
                                        item.id
                                      }
                                    >
                                      {
                                        item.title
                                      }
                                    </option>
                                  ),
                                )}
                              </select>

                              {song ? (
                                <p className="mt-1 text-xs text-primary">
                                  ♡{" "}
                                  {
                                    song.title
                                  }
                                </p>
                              ) : null}
                            </div>
                          );
                        },
                      )}
                    </div>

                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                      分享卡只使用你建立的文字與
                      IdolDays
                      配色，不含偶像官方照片或音樂封面。
                    </p>
                  </div>
                ) : null}
              </section>
            </>
          ) : null}
        </>
      )}

      <IdolSongFormSheet
        open={open}
        onOpenChange={setOpen}
        onSubmit={addSong}
      />
    </AppShell>
  );
}

function SectionLabel({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-medium tracking-[0.16em] text-primary">
        {eyebrow}
      </p>

      <h2 className="mt-1.5 font-display text-[18px] font-semibold">
        {title}
      </h2>

      {description ? (
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function SectionDivider() {
  return (
    <div className="my-8 flex items-center gap-3">
      <div className="h-px flex-1 bg-border/50" />
      <span className="text-[10px] text-primary/60">
        ♡
      </span>
      <div className="h-px flex-1 bg-border/50" />
    </div>
  );
}
