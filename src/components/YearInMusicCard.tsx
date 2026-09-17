import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Music2, Share2 } from "lucide-react";
import { streamingLink } from "@/lib/idol-music";
import {
  availableMusicYears,
  buildYearInMusic,
} from "@/lib/year-in-music";
import type { MusicTimelineItem } from "@/lib/music-timeline";
import { shareYearInMusicCard } from "@/lib/year-in-music-share";

type Props = {
  idolName: string;
  items: MusicTimelineItem[];
  ready?: boolean;
};

export function YearInMusicCard({
  idolName,
  items,
  ready = true,
}: Props) {
  const years = useMemo(
    () => availableMusicYears(items),
    [items],
  );

  const [selectedYear, setSelectedYear] =
    useState<number | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState("");

  useEffect(() => {
    if (years.length === 0) {
      setSelectedYear(null);
      return;
    }

    if (
      selectedYear == null ||
      !years.includes(selectedYear)
    ) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  const summary = useMemo(
    () =>
      selectedYear == null
        ? null
        : buildYearInMusic(items, selectedYear),
    [items, selectedYear],
  );

  if (!ready) {
    return (
      <section className="mt-7">
        <div className="h-52 animate-pulse rounded-[2rem] bg-surface/60" />
      </section>
    );
  }

  if (!summary || summary.memoryCount === 0) {
    return null;
  }

  const remembered = summary.mostRememberedSong;
  const listenUrl = remembered
    ? streamingLink(remembered.song)
    : "";

  const share = async () => {
    setSharing(true);
    setShareError("");

    try {
      await shareYearInMusicCard(
        idolName || "MY IDOL",
        summary,
      );
    } catch {
      setShareError("分享卡建立失敗，請再試一次。");
    } finally {
      setSharing(false);
    }
  };

  return (
    <section className="mt-7">
      <div className="rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-accent/20 px-5 py-6 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium tracking-[0.16em] text-primary">
              YEAR IN MUSIC ♡
            </p>

            <h2 className="mt-2 font-display text-[24px] font-semibold">
              {summary.year} OUR MUSIC
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              我和 {idolName || "他"} 的音樂一年
            </p>
          </div>

          {years.length > 1 ? (
            <select
              value={summary.year}
              onChange={(event) =>
                setSelectedYear(Number(event.target.value))
              }
              className="rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-xs outline-none"
              aria-label="選擇音樂回顧年份"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <Stat
            value={summary.todaySongCount}
            label="Today's Song"
          />
          <Stat
            value={summary.uniqueSongCount}
            label="留下的歌"
          />
          <Stat
            value={summary.comebackCount}
            label="Comeback"
          />
          <Stat
            value={summary.concertCount}
            label="Concert"
          />
        </div>

        {remembered ? (
          <div className="mt-5 rounded-[1.5rem] bg-card/75 px-4 py-4">
            <p className="text-[10px] font-medium tracking-[0.13em] text-primary">
              MOST REMEMBERED SONG
            </p>

            <div className="mt-2 flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Music2 className="size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[16px] font-semibold">
                  ♪ {remembered.song.title}
                </p>

                {remembered.song.artist ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {remembered.song.artist}
                  </p>
                ) : null}
              </div>

              {listenUrl ? (
                <a
                  href={listenUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`播放 ${remembered.song.title}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              ) : null}
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              今年在你的音樂回憶裡出現了{" "}
              <span className="font-medium text-foreground">
                {remembered.count}
              </span>{" "}
              次 ♡
            </p>
          </div>
        ) : null}

        <p className="mt-5 text-center font-display text-[13px] leading-6 text-muted-foreground">
          「原來這一年，喜歡你的日子，
          <br />
          都有自己的 BGM。」
        </p>

        <button
          type="button"
          disabled={sharing}
          onClick={() => void share()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          <Share2 className="size-4" />
          {sharing
            ? "正在建立年度回顧…"
            : `分享我的 ${summary.year} OUR MUSIC ♡`}
        </button>

        {shareError ? (
          <p
            role="alert"
            className="mt-2 text-center text-xs text-destructive"
          >
            {shareError}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function Stat({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-card/70 px-3 py-3.5 text-center">
      <p className="font-display text-[22px] font-semibold">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
