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
}: Props) {
  const months = useMemo(
    () => availableMusicMonths(items),
    [items],
  );

  const [selectedKey, setSelectedKey] =
    useState("");
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

  const selected = useMemo(() => {
    return (
      months.find(
        (month) => monthKey(month) === selectedKey,
      ) ?? null
    );
  }, [months, selectedKey]);

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
        <div className="h-48 animate-pulse rounded-[2rem] bg-surface/60" />
      </section>
    );
  }

  if (!summary || summary.memoryCount === 0) {
    return null;
  }

  const monthName =
    ENGLISH_MONTHS[summary.month - 1];

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
      <div className="rounded-[2rem] border border-border/60 bg-card/80 px-5 py-6 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-[0.15em] text-primary">
              MONTHLY MUSIC ♡
            </p>

            <h2 className="mt-2 font-display text-[21px] font-semibold">
              {monthName} WITH{" "}
              {(idolName || "MY IDOL").toUpperCase()}
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              {summary.year} · 我們這個月的聲音
            </p>
          </div>

          {months.length > 1 ? (
            <select
              value={selectedKey}
              onChange={(event) =>
                setSelectedKey(event.target.value)
              }
              aria-label="選擇月份"
              className="shrink-0 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs outline-none"
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

        <div className="mt-5 rounded-[1.6rem] bg-primary/5 px-4 py-5 text-center">
          <p className="font-display text-[32px] font-semibold">
            {summary.memoryCount}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            次音樂記憶留在這個月 ♡
          </p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat
            value={summary.uniqueSongCount}
            label="SONGS"
          />

          <Stat
            value={summary.comebackCount}
            label="COMEBACK"
          />

          <Stat
            value={summary.concertCount}
            label="CONCERT"
          />
        </div>

        {remembered ? (
          <div className="mt-4 rounded-[1.5rem] bg-surface/65 px-4 py-4">
            <p className="text-[10px] font-medium tracking-[0.13em] text-primary">
              SONG OF THE MONTH
            </p>

            <div className="mt-2 flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Music2 className="size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">
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

            {remembered.count > 1 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                這個月在你的回憶裡出現了{" "}
                {remembered.count} 次 ♡
              </p>
            ) : null}
          </div>
        ) : null}

        <p className="mt-5 text-center font-display text-xs italic text-muted-foreground">
          {monthName.charAt(0) +
            monthName.slice(1).toLowerCase()}{" "}
          sounded like this.
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
            : `分享我的 ${summary.month} 月音樂 ♡`}
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
    <div className="rounded-2xl bg-surface/60 px-2 py-3 text-center">
      <p className="font-display text-xl font-semibold">
        {value}
      </p>

      <p className="mt-1 text-[9px] tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
