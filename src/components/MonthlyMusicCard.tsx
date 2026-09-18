import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Music2, Share2 } from "lucide-react";

import { streamingLink } from "@/lib/idol-music";
import type { MusicTimelineItem } from "@/lib/music-timeline";
import {
  availableMusicMonths,
  buildMonthlyMusic,
  type MusicMonth,
} from "@/lib/monthly-music";
import { shareMonthlyMusicCard } from "@/lib/monthly-music-share";

type Props = {
  idolName: string;
  items: MusicTimelineItem[];
  ready?: boolean;
  photo?: string;
  cutoutPhoto?: string;
};

const ENGLISH_MONTHS = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

const CHINESE_MONTHS = [
  "一月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月",
];

function monthKey(value: MusicMonth) {
  return `${value.year}-${value.month}`;
}

function monthLabel(value: MusicMonth) {
  return `${value.year}年${value.month}月`;
}

export function MonthlyMusicCard({
  idolName,
  items,
  ready = true,
photo,
cutoutPhoto,
}: Props) {
  const months = useMemo(
    () => availableMusicMonths(items),
    [items],
  );

  const [selectedKey, setSelectedKey] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState("");

  useEffect(() => {
    if (months.length === 0) {
      setSelectedKey("");
      return;
    }

    const availableKeys = months.map(monthKey);

    if (
      !selectedKey ||
      !availableKeys.includes(selectedKey)
    ) {
      setSelectedKey(monthKey(months[0]));
    }
  }, [months, selectedKey]);

  const selected = useMemo(
    () =>
      months.find(
        (month) => monthKey(month) === selectedKey,
      ) ?? null,
    [months, selectedKey],
  );

  const summary = useMemo(
    () =>
      selected
        ? buildMonthlyMusic(
            items,
            selected.year,
            selected.month,
          )
        : null,
    [items, selected],
  );

  if (!ready) {
    return (
      <section className="mt-7">
        <div className="h-56 animate-pulse rounded-[2rem] bg-surface/60" />
      </section>
    );
  }

  if (!summary || summary.memoryCount === 0) {
    return null;
  }

  const monthName = ENGLISH_MONTHS[summary.month - 1];
  const chineseMonth =
    CHINESE_MONTHS[summary.month - 1];

  const remembered = summary.songOfTheMonth;
  const listenUrl = remembered
    ? streamingLink(remembered.song)
    : "";

  const share = async () => {
    setSharing(true);
    setShareError("");

    try {
      await shareMonthlyMusicCard(
        idolName || "MY IDOL",
        summary,
        {
          photo,
          cutoutPhoto,
        },
      );
    } catch {
      setShareError(
        "月度分享卡建立失敗，請再試一次。",
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <section className="mt-7">
      <div className="music-recap-booklet overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-accent/15 px-5 py-6 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium tracking-[0.16em] text-primary">
              {monthName} IN MUSIC ♡
            </p>

            <h2 className="mt-2 font-display text-[22px] font-semibold">
              我和 {idolName || "他"} 的{chineseMonth}
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              {summary.year} · 這個月，我們留下了這些聲音
            </p>
          </div>

          {months.length > 1 ? (
            <select
              value={selectedKey}
              onChange={(event) =>
                setSelectedKey(event.target.value)
              }
              aria-label="選擇月份"
              className="shrink-0 rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-xs outline-none"
            >
              {months.map((month) => (
                <option
                  key={monthKey(month)}
                  value={monthKey(month)}
                >
                  {monthLabel(month)}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="music-recap-hero mt-6 rounded-[1.7rem] bg-card/65 px-4 py-5 text-center">
          <span
            className="music-recap-hero-label"
            aria-hidden="true"
          >
            MONTHLY ISSUE
          </span>
          <p className="font-display text-[38px] font-semibold leading-none">
            {summary.memoryCount}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            個音樂回憶留在這個月 ♡
          </p>
        </div>

        <div className="music-recap-stats mt-3 grid grid-cols-2 gap-2.5">
          <Stat
            value={summary.uniqueSongCount}
            unit="首"
            label="留下的歌"
          />

          <Stat
            value={summary.todaySongCount}
            unit="天"
            label="今日歌曲"
          />

          <Stat
            value={summary.comebackCount}
            unit="次"
            label="回歸"
          />

          <Stat
            value={summary.concertCount}
            unit="場"
            label="演唱會"
          />
        </div>

        {remembered ? (
          <div className="music-recap-featured mt-5 rounded-[1.6rem] bg-surface/65 px-4 py-4">
            <p className="text-[10px] font-medium tracking-[0.13em] text-primary">
              SONG OF THE MONTH
            </p>

            <p className="mt-1 text-[11px] text-muted-foreground">
              這個月最常出現在回憶裡的歌
            </p>

            <div className="mt-3 flex items-center gap-3">
              <div className="music-recap-mini-disc flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span
                  className="music-recap-mini-disc-hole"
                  aria-hidden="true"
                />
                <Music2 className="relative z-10 size-3.5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[16px] font-semibold">
                  ♪ {remembered.song.title}
                </p>

                {remembered.song.artist ? (
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
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
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              ) : null}
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              這個月在你的音樂回憶裡出現了{" "}
              <span className="font-medium text-foreground">
                {remembered.count}
              </span>{" "}
              次 ♡
            </p>
          </div>
        ) : null}

        <p className="mt-5 text-center font-display text-[13px] leading-6 text-muted-foreground">
          「{chineseMonth}的我們，
          <br />
          後來都有歌可以記得。」
        </p>

        <button
          type="button"
          disabled={sharing}
          onClick={() => void share()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          <Share2 className="size-4" />
          {sharing
            ? "正在建立月度回顧…"
            : `分享我的 ${summary.month} 月音樂回顧 ♡`}
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
  unit,
  label,
}: {
  value: number;
  unit: string;
  label: string;
}) {
  return (
    <div className="music-recap-stat rounded-2xl bg-card/70 px-3 py-3.5 text-center">
      <p className="font-display text-[22px] font-semibold">
        {value}
        <span className="ml-1 text-[10px] font-normal text-muted-foreground">
          {unit}
        </span>
      </p>

      <p className="mt-1 text-[10px] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
