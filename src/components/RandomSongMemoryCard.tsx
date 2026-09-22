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
    <section className="mt-3 rounded-[1.55rem] border border-border/70 bg-card/85 px-4 py-3.5 text-card-foreground shadow-soft">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Music2 className="size-5" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-primary">
            {onThisDay ? "去年的今天 ♡" : "♪ 又遇見這首歌 ♡"}
          </p>
          <p className="mt-0.5 truncate text-[16px] font-medium">♪ {item.title}</p>
          <p className="mt-0.5 truncate text-[14px] text-muted-foreground">
            {item.artist ? `${item.artist}・` : ""}{formatMemoryDate(item.date)}
            {item.mood ? `・${item.mood}` : ""}
          </p>
        </div>
        <Link
          to="/music"
          aria-label="打開音樂日記"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/[0.08] text-primary transition-transform active:scale-90"
        >
          <ArrowRight className="size-4" strokeWidth={1.8} />
        </Link>
      </div>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="mt-2.5 inline-flex min-h-11 items-center gap-1.5 text-[14px] font-medium text-primary"
        >
          ♪ 再聽一次
          <ArrowRight className="size-3.5" />
        </a>
      ) : null}
    </section>
  );
}
