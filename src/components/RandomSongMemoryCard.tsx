import { ArrowRight, Music2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

type SongMemoryItem = {
  id: string;
  songId: string;
  title: string;
  artist?: string | null;
  date: string;
  mood?: string | null;
  appleMusicUrl?: string | null;
  spotifyUrl?: string | null;
};

type Props = {
  items: SongMemoryItem[];
  ready?: boolean;
};

type ResurfacedMemory = {
  item: SongMemoryItem;
  onThisDay: boolean;
  yearsAgo: number;
};

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function dayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function monthDayKey(date: Date) {
  return `${date.getMonth() + 1}-${date.getDate()}`;
}

function formatMemoryDate(value: string) {
  const date = parseLocalDate(value);

  if (!date) return value.replaceAll("-", ".");

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join(".");
}

function chooseMemory(items: SongMemoryItem[]): ResurfacedMemory | null {
  const today = new Date();
  const todayKey = dayKey(today);
  const todayMonthDay = monthDayKey(today);

  const past = items
    .map((item) => ({
      item,
      date: parseLocalDate(item.date),
    }))
    .filter(
      (
        value,
      ): value is {
        item: SongMemoryItem;
        date: Date;
      } =>
        value.date !== null &&
        value.item.date !== todayKey &&
        value.date.getTime() < today.getTime(),
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  if (past.length === 0) return null;

  const onThisDay = past
    .filter(({ date }) => monthDayKey(date) === todayMonthDay)
    .sort((a, b) => b.date.getFullYear() - a.date.getFullYear())[0];

  if (onThisDay) {
    return {
      item: onThisDay.item,
      onThisDay: true,
      yearsAgo: today.getFullYear() - onThisDay.date.getFullYear(),
    };
  }

  /*
   * General resurfacing stays deterministic for the whole local day.
   * This avoids the memory changing every time the component renders.
   */
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();

  const selected = past[seed % past.length];

  return {
    item: selected.item,
    onThisDay: false,
    yearsAgo: 0,
  };
}

function streamingLink(item: SongMemoryItem) {
  return item.appleMusicUrl || item.spotifyUrl || "";
}

export function RandomSongMemoryCard({ items, ready = true }: Props) {
  if (!ready) return null;

  const memory = chooseMemory(items);

  if (!memory) return null;

  const { item, onThisDay, yearsAgo } = memory;
  const link = streamingLink(item);

  return (
    <section className="rounded-[1.8rem] border border-border/70 bg-card/90 p-4 text-card-foreground shadow-soft backdrop-blur-xl">
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Music2 className="size-5" strokeWidth={1.55} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-primary">
            {onThisDay ? "ON THIS DAY ♡" : "MUSIC MEMORY ♡"}
          </p>

          <p className="mt-1.5 text-[15px] font-medium leading-relaxed">
            {onThisDay
              ? yearsAgo === 1
                ? "去年的今天，我們聽了這首歌"
                : `${yearsAgo} 年前的今天，我們聽了這首歌`
              : "那一天，我們留下了這首歌"}
          </p>

          {!onThisDay ? (
            <p className="mt-1 text-[11px] tracking-[0.06em] text-muted-foreground">
              {formatMemoryDate(item.date)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-[1.4rem] bg-surface/60 px-4 py-3.5">
        <p className="truncate text-[15px] font-medium">♪ {item.title}</p>

        {item.artist ? (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {item.artist}
          </p>
        ) : null}

        {item.mood ? (
          <p className="mt-3 text-[18px]" aria-label={`那天的心情：${item.mood}`}>
            {item.mood}
          </p>
        ) : null}
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
        {onThisDay
          ? "有些歌一響起，就會回到那一天。"
          : "有些喜歡過的日子，會被一首歌重新想起。"}
      </p>

      <div className="mt-3 flex items-center justify-between gap-3">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary"
          >
            🎧 再聽一次
            <ArrowRight className="size-3" />
          </a>
        ) : (
          <span />
        )}

        <Link
          to="/music"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary"
        >
          音樂日記
          <ArrowRight className="size-3" />
        </Link>
      </div>
    </section>
  );
}
