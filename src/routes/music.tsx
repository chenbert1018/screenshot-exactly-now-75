import { useMemo, useState, useEffect} from "react";
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
import { StoredImage } from "@/components/StoredImage";
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
import { shareTodaySongCard } from "@/lib/music-diary-share";
import {
  useSongJournalHistory,
  useTodaySongJournal,
} from "@/lib/idol-song-journal.source";
import {
  SONG_MOOD_OPTIONS,
  type SongMood,
} from "@/lib/idol-song-journal";
import { useComebackDiaryHistory } from "@/lib/comeback-diary.source";
import { useConcertMusicMemoryHistory } from "@/lib/concert-music-memory.source";
import { buildMusicTimeline } from "@/lib/music-timeline";
import { useEventSource } from "@/lib/events.source";
import { useMemorySource } from "@/lib/memories.source";

export const Route = createFileRoute("/music")({
  validateSearch: (search: Record<string, unknown>) => ({
    addSong: search.addSong === "1" ? "1" : undefined,
  }),
  component: MusicPage,
});

function MusicPage() {
  const search = Route.useSearch();

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

  const todayJournal =
    useTodaySongJournal(homeIdol?.id);

  const comebackHistory =
    useComebackDiaryHistory(homeIdol?.id);

  const concertHistory =
    useConcertMusicMemoryHistory(homeIdol?.id);

  const eventSource = useEventSource();
  const memorySource = useMemorySource();

  const timelineMemories = useMemo(
    () =>
      memorySource.all.filter(
        (memory) =>
          memory.idolId === homeIdol?.id &&
          Boolean(memory.songId),
      ),
    [
      memorySource.all,
      homeIdol?.id,
    ],
  );

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
        memories: timelineMemories,
      }),
    [
      songs,
      songHistory.entries,
      comebackHistory.entries,
      concertHistory.entries,
      timelineEvents,
      timelineMemories,
    ],
  );

  const timelineReady =
    songHistory.ready &&
    comebackHistory.ready &&
    concertHistory.ready &&
    eventSource.ready &&
    memorySource.ready;

  const [open, setOpen] =
    useState(false);

  const [libraryOpen, setLibraryOpen] =
    useState(false);

  const [soundtrackOpen, setSoundtrackOpen] =
    useState(false);

  const [memoriesOpen, setMemoriesOpen] =
    useState(false);

  const [recapOpen, setRecapOpen] =
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

  const chooseTodaySong = async (
    songId: string,
  ) => {
    await setTodayPick(songId);
    await todayJournal.save({
      songId,
    });
  };

  const chooseMood = async (
    mood: SongMood,
  ) => {
    if (!today) return;

    await todayJournal.save({
      songId: today.id,
      mood,
    });
  };

  const shareTodayFeeling = async () => {
    if (!today) return;
    const mood = todayJournal.entry?.mood;

    try {
      await shareTodaySongCard({
        title: today.title,
        artist: today.artist,
        mood,
        idolName: homeIdol?.name,
      });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setActionError("今天的音樂心情沒有分享成功，請再試一次。");
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
      <PageHeader
        title="我和他的歌 🎧"
        subtitle="今日一曲・心情・回歸歌單 ♡"
      />

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
              className="min-h-[50px] rounded-full bg-primary px-5 py-3 text-base text-primary-foreground"
            >
              前往偶像
            </Link>
          }
        />
      ) : (
        <>
          {/* 今日 */}
          <section className="music-diary-now-playing relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 p-4 shadow-soft">
            <span
              aria-hidden="true"
              className="absolute right-5 top-4 text-[13px] text-primary/60"
            >
              ✦
            </span>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold tracking-[0.14em] text-primary">
                  今日一曲 ♡
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {today ? "正在播放 ♪" : "選今天的歌 ♪"}
                </p>
              </div>

              <span className="music-diary-date-mark" aria-hidden="true">
                今日
              </span>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => setLibraryOpen(true)}
                aria-label={today ? "更換今天的歌曲" : "選擇今天的歌曲"}
                className="music-diary-album relative h-[112px] w-[126px] shrink-0 disabled:opacity-50"
              >
                <span
                  aria-hidden="true"
                  className={`music-diary-disc absolute right-0 top-[12px] size-[88px] rounded-full border border-primary/20 ${
                    today ? "music-diary-disc--playing" : ""
                  }`}
                >
                  <span className="absolute inset-[14%] rounded-full border border-primary/10" />
                  <span className="absolute inset-[30%] rounded-full border border-primary/10" />
                  <span className="absolute inset-[42%] rounded-full bg-card shadow-[0_0_0_1px_var(--border)]" />
                  <span className="absolute inset-[47%] rounded-full bg-primary/60" />
                  <span className="music-diary-disc-shine absolute inset-0 rounded-full" />
                </span>

                <span className="music-diary-photocard absolute bottom-0 left-0 z-10 h-[106px] w-[78px] overflow-hidden rounded-[0.9rem] border border-border/70 bg-surface shadow-soft">
                  {homeIdol.cutoutPhoto ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-b from-primary/10 via-surface/50 to-card"
                      />
                      <StoredImage
                        src={homeIdol.cutoutPhoto}
                        alt={`${homeIdol.name} 的照片`}
                        className="relative z-10 size-full object-contain object-bottom"
                      />
                    </>
                  ) : homeIdol.photo ? (
                    <StoredImage
                      src={homeIdol.photo}
                      alt={`${homeIdol.name} 的照片`}
                      className="size-full object-cover object-center"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center font-display text-[22px] text-primary">
                      {homeIdol.name.trim().slice(0, 1) || "♡"}
                    </span>
                  )}

                  <span
                    aria-hidden="true"
                    className="absolute bottom-1.5 right-2 z-20 text-[9px] text-primary"
                  >
                    ♡
                  </span>
                </span>

                <span
                  aria-hidden="true"
                  className="absolute left-[71px] top-0 z-20 text-[11px] text-primary/70"
                >
                  ✦
                </span>
              </button>

              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[20px] font-semibold leading-tight">
                  {today?.title || "今天想聽哪一首？"}
                </p>

                <p className="mt-1.5 truncate text-sm text-muted-foreground">
                  {today?.artist || `和 ${homeIdol.name || "他"} 選一首今天的歌`}
                </p>

                <button
                  type="button"
                  onClick={() => setLibraryOpen(true)}
                  className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold tracking-[0.08em] text-primary"
                >
                  {today ? "換一首" : "＋ 選一首"}
                </button>

                {today && streamingLink(today) ? (
                  <a
                    href={streamingLink(today)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 flex min-h-11 w-fit items-center gap-1 text-sm text-muted-foreground"
                  >
                    ♪ 去聽
                    <ExternalLink className="size-3" />
                  </a>
                ) : null}
              </div>
            </div>

            {today ? (
              <div className="mt-5 border-t border-border/60 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold tracking-[0.12em] text-muted-foreground">
                    今日'S MOOD
                  </p>

                  {todayJournal.entry?.mood ? (
                    <span className="text-[13px] text-primary">
                      收好了 ♡
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex items-center justify-between px-1">
                  {SONG_MOOD_OPTIONS.map((mood, index) => {
                    const selected = todayJournal.entry?.mood === mood;

                    return (
                      <button
                        key={mood}
                        type="button"
                        disabled={Boolean(busy) || !todayJournal.ready}
                        aria-label={`今天的心情：${mood}`}
                        aria-pressed={selected}
                        onClick={() =>
                          void run(
                            `mood-${mood}`,
                            () => chooseMood(mood),
                          )
                        }
                        className={`music-diary-mood ${
                          selected ? "music-diary-mood--active" : ""
                        }`}
                        style={{
                          "--music-mood-rotate": `${[-4, 2, -2, 4, -3][index] ?? 0}deg`,
                        } as React.CSSProperties}
                      >
                        <span>{mood}</span>
                        {selected ? (
                          <span
                            aria-hidden="true"
                            className="music-diary-mood-heart"
                          >
                            ♡
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => void shareTodayFeeling()}
                  className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-surface/70 px-4 py-2.5 text-sm font-medium text-primary transition-transform active:scale-[0.97]"
                >
                  <Share2 className="size-3.5" strokeWidth={1.8} />
                  分享今天的歌與心情
                </button>
              </div>
            ) : null}
          </section>

          {actionError ||
          error ||
          todayJournal.error ? (
            <p
              role="alert"
              className="mt-3 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {actionError ||
                (todayJournal.error
                  ? "今天的音樂日記暫時無法讀取，請稍後再試。"
                  : "歌曲資料暫時讀取失敗，請稍後再試。")}
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
              <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Library className="size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  我的歌曲
                </p>

                <p className="mt-0.5 text-sm text-muted-foreground">
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
                  <p className="text-sm text-muted-foreground">
                    選擇今天的歌或管理收藏
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setOpen(true)
                    }
                    className="inline-flex items-center gap-1 min-h-11 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
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
                        className="min-h-[50px] rounded-full bg-primary px-5 py-3 text-base text-primary-foreground"
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
                                        chooseTodaySong(
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
                              className="flex size-11 items-center justify-center text-muted-foreground"
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
                我的追星音樂日記
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                今日歌曲 · 回歸 · 演唱會 ·
                音樂回憶
              </p>
            </div>

            {memoriesOpen ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </button>

          {memoriesOpen ? (
            <div className="mt-3">
              <div className="mb-3 flex items-center justify-between gap-3 rounded-[1.4rem] bg-primary/[0.06] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold tracking-[0.1em] text-primary">MEMORY × MUSIC ♡</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    回憶裡選過的歌，也會一起留在這條音樂時間線。
                  </p>
                </div>
                <Link
                  to="/memories"
                  className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-primary/15 bg-card px-3.5 text-sm font-medium text-primary transition-transform active:scale-95"
                >
                  看回憶
                </Link>
              </div>
              <MusicTimeline
                items={timelineItems}
                ready={timelineReady}
              />
            </div>
          ) : null}

          {/* RECAP */}

          <SectionDivider />

          <section>

            <button

              type="button"

              onClick={() =>
                setRecapOpen(
                  (value) => !value,
                )
              }

              className="music-recap-toggle flex w-full items-center gap-3 rounded-[1.6rem] bg-surface/55 px-4 py-4 text-left"

            >

              <div
                className="music-recap-toggle-mark"
                aria-hidden="true"
              >
                <span>REC</span>
                <strong>♪</strong>
              </div>

              <div className="min-w-0 flex-1">

                <p className="text-[13px] font-medium tracking-[0.1em] text-primary">

                  RECAP ♡

                </p>

                <p className="mt-1 font-display text-[15px] font-medium">

                  我們的音樂回顧

                </p>

                <p className="mt-1 text-sm text-muted-foreground">

                  這個月與這一年的歌，都替你留在這裡。

                </p>

              </div>

              {recapOpen ? (

                <ChevronUp className="size-4 text-muted-foreground" />

              ) : (

                <ChevronDown className="size-4 text-muted-foreground" />

              )}

            </button>

            {recapOpen ? (

              <div className="mt-4">

                <MonthlyMusicCard

                  idolName={
                    homeIdol.name || "他"
                  }

                  items={timelineItems}

                  ready={timelineReady}
                  photo={homeIdol.photo}
                  cutoutPhoto={homeIdol.cutoutPhoto}

                />

                <YearInMusicCard

                  idolName={
                    homeIdol.name || "他"
                  }

                  items={timelineItems}

                  ready={timelineReady}
                  photo={homeIdol.photo}
                  cutoutPhoto={homeIdol.cutoutPhoto}

                />

              </div>

            ) : null}

          </section>

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
                  className="music-soundtrack-toggle flex w-full items-center gap-3 rounded-[1.6rem] bg-surface/55 px-4 py-4 text-left"
                >
                  <div
                    className="music-soundtrack-cassette"
                    aria-hidden="true"
                  >
                    <span className="music-soundtrack-reel" />
                    <span className="music-soundtrack-reel" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold tracking-[0.12em] text-primary">
                      MY IDOL SOUNDTRACK ♡
                    </p>
                    <p className="mt-1 font-display text-[15px] font-medium">
                      六首只屬於我們的歌
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      不是排行榜，是我喜歡你的方式。
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
                        className="inline-flex items-center gap-1 min-h-11 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                      >
                        <Share2 className="size-3.5" />
                        {sharing
                          ? "建立中…"
                          : "分享卡"}
                      </button>
                    </div>

                    <div className="music-soundtrack-tracklist space-y-2">
                      {SONG_ROLE_OPTIONS.map(
                        ([role, label]) => {
                          const song =
                            roleSong(role);

                          return (
                            <div
                              key={role}
                              className="music-soundtrack-track rounded-2xl bg-surface/60 px-4 py-3"
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
      <p className="text-[13px] font-medium tracking-[0.12em] text-primary">
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
      <span className="text-[13px] text-primary/60">
        ♡
      </span>
      <div className="h-px flex-1 bg-border/50" />
    </div>
  );
}
