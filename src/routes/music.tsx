import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Library,
  Plus,
  Trash2,
} from "lucide-react";

import {
  AppShell,
  EmptyState,
  PageHeader,
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
import { useListenAgainHistory } from "@/lib/listen-again.source";
import { MusicDiscIcon } from "@/components/IdolDaysIcons";

export const Route = createFileRoute("/music")({
  validateSearch: (search: Record<string, unknown>) => ({
    addSong: search.addSong === "1" ? "1" : undefined,
    idol: typeof search.idol === "string" ? search.idol : undefined,
  }),
  component: MusicPage,
});

function MusicPage() {
  const search = Route.useSearch();

  const {
    homeIdol,
    findIdol,
    ready: idolsReady,
  } = useIdolSource();
  const activeIdol = search.idol ? findIdol(search.idol) ?? homeIdol : homeIdol;

  const {
    songs,
    roles,
    ready,
    error,
    addSong,
    setTodayPick,
    assignRole,
    removeSong,
  } = useIdolMusicSource(activeIdol?.id);

  const songHistory =
    useSongJournalHistory(activeIdol?.id);

  const todayJournal =
    useTodaySongJournal(activeIdol?.id);

  const comebackHistory =
    useComebackDiaryHistory(activeIdol?.id);

  const concertHistory =
    useConcertMusicMemoryHistory(activeIdol?.id);

  const eventSource = useEventSource();
  const memorySource = useMemorySource();
  const listenAgainHistory =
    useListenAgainHistory(activeIdol?.id);

  const timelineMemories = useMemo(
    () =>
      memorySource.all.filter(
        (memory) =>
          memory.idolId === activeIdol?.id &&
          Boolean(memory.songId),
      ),
    [
      memorySource.all,
      activeIdol?.id,
    ],
  );

  const timelineEvents = useMemo(
    () =>
      eventSource.events.filter(
        (event) =>
          event.idolId === activeIdol?.id,
      ),
    [
      eventSource.events,
      activeIdol?.id,
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
        listenAgainEntries:
          listenAgainHistory.entries,
      }),
    [
      songs,
      songHistory.entries,
      comebackHistory.entries,
      concertHistory.entries,
      timelineEvents,
      timelineMemories,
      listenAgainHistory.entries,
    ],
  );

  const timelineReady =
    songHistory.ready &&
    comebackHistory.ready &&
    concertHistory.ready &&
    eventSource.ready &&
    memorySource.ready &&
    listenAgainHistory.ready;

  const [open, setOpen] =
    useState(false);

  const [libraryOpen, setLibraryOpen] =
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
        idolName: activeIdol?.name,
      });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setActionError("今天的音樂心情沒有分享成功，請再試一次。");
    }
  };

  const share = async () => {
    if (!activeIdol) return;

    setSharing(true);
    setActionError("");

    try {
      await shareSoundtrackCard(
        activeIdol.name || "MY IDOL",
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
        title={`我和 ${activeIdol?.name || "他"} 的歌`}
        subtitle="那些陪我們走過不同時刻的歌"
      />

      {!idolsReady ? (
        <div className="h-40 rounded-3xl bg-surface/50" />
      ) : !activeIdol ? (
        <EmptyState
          icon={
            <MusicDiscIcon className="size-5" />
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


            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold tracking-[0.14em] text-primary">
                  TODAY’S SONG
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
                  {activeIdol.cutoutPhoto ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-b from-primary/10 via-surface/50 to-card"
                      />
                      <StoredImage
                        src={activeIdol.cutoutPhoto}
                        alt={`${activeIdol.name} 的照片`}
                        className="relative z-10 size-full object-contain object-bottom"
                      />
                    </>
                  ) : activeIdol.photo ? (
                    <StoredImage
                      src={activeIdol.photo}
                      alt={`${activeIdol.name} 的照片`}
                      className="size-full object-cover object-center"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center font-display text-[22px] text-primary">
                      {activeIdol.name.trim().slice(0, 1) || "♡"}
                    </span>
                  )}


                </span>


              </button>

              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[20px] font-semibold leading-tight">
                  {today?.title || "今天想聽哪一首？"}
                </p>

                <p className="mt-1.5 truncate text-sm text-muted-foreground">
                  {today?.artist || `和 ${activeIdol.name || "他"} 選一首今天的歌`}
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
                    今天的心情
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
              className="flex w-full items-center gap-3 border-y border-border/60 px-1 py-4 text-left"
            >
              <div className="flex size-9 items-center justify-center text-primary">
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
                      <MusicDiscIcon className="size-5" />
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
                            <MusicDiscIcon className="mt-0.5 size-5 shrink-0 text-primary" />

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

          {/* MUSIC MEMORIES — always visible, no accordion */}
          <section className="mt-7">
            <div className="mb-4 flex items-end justify-between gap-4 px-1">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.18em] text-primary">
                  MUSIC MEMORIES
                </p>
                <h2 className="mt-1 font-display text-[22px] font-semibold tracking-[-0.02em]">
                  我的追星音樂日記
                </h2>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  那些歌，和喜歡他的日子一起留下來。
                </p>
              </div>
              <Link
                to="/memories"
                className="shrink-0 pb-0.5 text-[13px] font-medium text-primary"
              >
                全部回憶 →
              </Link>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 px-4 pb-4 pt-5 shadow-soft">
              <div className="mb-4 grid grid-cols-4 divide-x divide-border/60 border-b border-border/60 pb-4 text-center">
                <div>
                  <strong className="block font-display text-[20px] font-semibold">{songHistory.entries.length}</strong>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">今日歌曲</span>
                </div>
                <div>
                  <strong className="block font-display text-[20px] font-semibold">{comebackHistory.entries.length}</strong>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">回歸</span>
                </div>
                <div>
                  <strong className="block font-display text-[20px] font-semibold">{concertHistory.entries.length}</strong>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">演唱會</span>
                </div>
                <div>
                  <strong className="block font-display text-[20px] font-semibold">{timelineMemories.length}</strong>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">音樂回憶</span>
                </div>
              </div>

              <MusicTimeline items={timelineItems} ready={timelineReady} />
            </div>
          </section>

          {/* MONTHLY / YEARLY — editorial recap, always visible */}
          <section className="mt-8">
            <div className="mb-4 px-1">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-primary">
                MUSIC RECAP
              </p>
              <h2 className="mt-1 font-display text-[22px] font-semibold tracking-[-0.02em]">
                我們的音樂回顧
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                回頭看看，最近哪些歌陪我們走過。
              </p>
            </div>

            <div className="space-y-4">
              <MonthlyMusicCard
                idolName={activeIdol.name || "他"}
                items={timelineItems}
                ready={timelineReady}
                photo={activeIdol.photo}
                cutoutPhoto={activeIdol.cutoutPhoto}
              />
              <YearInMusicCard
                idolName={activeIdol.name || "他"}
                items={timelineItems}
                ready={timelineReady}
                photo={activeIdol.photo}
                cutoutPhoto={activeIdol.cutoutPhoto}
              />
            </div>
          </section>

          {/* MY IDOL SOUNDTRACK — tracklist, not accordion */}
          {songs.length > 0 ? (
            <section className="mt-8">
              <div className="mb-4 flex items-end justify-between gap-4 px-1">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-primary">
                    MY IDOL SOUNDTRACK
                  </p>
                  <h2 className="mt-1 font-display text-[22px] font-semibold tracking-[-0.02em]">
                    六首只屬於我們的歌
                  </h2>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    不是排行榜，是我喜歡他的方式。
                  </p>
                </div>
                <button
                  type="button"
                  disabled={sharing}
                  onClick={() => void share()}
                  className="min-h-10 shrink-0 rounded-full border border-border/70 bg-card px-3.5 text-[13px] font-medium text-primary disabled:opacity-60"
                >
                  {sharing ? "建立中…" : "分享"}
                </button>
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 shadow-soft">
                {SONG_ROLE_OPTIONS.map(([role, label], index) => {
                  const song = roleSong(role);
                  return (
                    <div
                      key={role}
                      className={`grid grid-cols-[32px_1fr] gap-3 px-4 py-4 ${
                        index > 0 ? "border-t border-border/60" : ""
                      }`}
                    >
                      <span className="pt-0.5 font-display text-[13px] tabular-nums text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <label className="block text-[11px] font-semibold tracking-[0.08em] text-muted-foreground">
                          {label}
                        </label>
                        <select
                          value={song?.id || ""}
                          disabled={Boolean(busy)}
                          onChange={(event) =>
                            event.target.value &&
                            void run(`role-${role}`, () =>
                              assignRole(role, event.target.value),
                            )
                          }
                          className="mt-1.5 w-full appearance-none bg-transparent font-display text-[16px] font-medium outline-none"
                        >
                          <option value="">選一首歌</option>
                          {songs.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.title}
                            </option>
                          ))}
                        </select>
                        {song?.artist ? (
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {song.artist}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-3 px-1 text-xs leading-5 text-muted-foreground">
                分享卡只使用你建立的文字與 IdolDays 配色，不含偶像官方照片或音樂封面。
              </p>
            </section>
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
