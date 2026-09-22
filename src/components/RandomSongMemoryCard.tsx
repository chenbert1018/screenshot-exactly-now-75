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
    <section className="music-memory-resurface text-card-foreground">
      <div className="music-memory-resurface-heading">
        <div>
          <p className="music-memory-resurface-kicker">
            {onThisDay ? "去年的今天 ♡" : "♪ 又遇見這首歌 ♡"}
          </p>

          <p className="music-memory-resurface-title">
            {onThisDay
              ? yearsAgo === 1
                ? "去年的今天，我們聽了這首歌"
                : `${yearsAgo} 年前的今天，我們聽了這首歌`
              : "今天，又遇見那時候聽的歌。"}
          </p>
        </div>

        <span
          className="music-memory-resurface-spark"
          aria-hidden="true"
        >
          ✦
        </span>
      </div>

      <div className="music-memory-polaroid">
        <div
          className="music-memory-polaroid-photo"
          aria-hidden="true"
        >
          <div className="music-memory-polaroid-disc">
            <span className="music-memory-polaroid-disc-hole" />

            <Music2
              className="music-memory-polaroid-note"
              strokeWidth={1.4}
            />
          </div>

          <span className="music-memory-polaroid-date">
            {formatMemoryDate(item.date)}
          </span>
        </div>

        <div className="music-memory-polaroid-caption">
          <p className="music-memory-polaroid-song">
            ♪ {item.title}
          </p>

          {item.artist ? (
            <p className="music-memory-polaroid-artist">
              {item.artist}
            </p>
          ) : null}

          <div className="music-memory-polaroid-meta">
            <span>{onThisDay ? "那一天 ♡" : "又想起了 ♡"}</span>

            {item.mood ? (
              <span
                className="music-memory-polaroid-mood"
                aria-label={`那天的心情：${item.mood}`}
              >
                {item.mood}
              </span>
            ) : (
              <span aria-hidden="true">♡</span>
            )}
          </div>
        </div>
      </div>

      <p className="music-memory-resurface-copy">
        {onThisDay
          ? "有些歌一響起，就會回到那一天。"
          : "有些喜歡過的日子，會被一首歌重新想起。"}
      </p>

      <div className="music-memory-resurface-actions">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="music-memory-resurface-listen"
          >
            ♪ 再聽一次
            <ArrowRight className="size-3" />
          </a>
        ) : (
          <span />
        )}

        <Link
          to="/music"
          className="music-memory-resurface-diary"
        >
          音樂日記
          <ArrowRight className="size-3" />
        </Link>
      </div>
    </section>
  );
}
