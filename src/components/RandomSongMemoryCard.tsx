import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { MusicDiscIcon } from "./IdolDaysIcons";
import { Link } from "@tanstack/react-router";
import {
  SONG_MOOD_OPTIONS,
  type SongMood,
} from "@/lib/idol-song-journal";
import { useListenAgainHistory } from "@/lib/listen-again.source";

type SongMemoryItem = {
  id: string;
  journalEntryId?: string | null;
  idolId: string;
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
  const memory = chooseMemory(items);
  const idolId = memory?.item.idolId;

  const listenAgainHistory = useListenAgainHistory(idolId);
  const [choosingMood, setChoosingMood] = useState(false);
  const [savingMood, setSavingMood] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!ready || !memory) return null;

  const { item, onThisDay, yearsAgo } = memory;
  const link = streamingLink(item);

  const savedListenAgain =
    listenAgainHistory.entries.find(
      (entry) =>
        entry.songId === item.songId &&
        entry.originalDate === item.date,
    ) ?? null;

  async function chooseNowMood(mood: SongMood) {
    if (savingMood) return;

    setSavingMood(true);
    setSaveError(null);

    try {
      await listenAgainHistory.saveListenAgain({
        songId: item.songId,
        sourceJournalEntryId: item.journalEntryId ?? null,
        originalDate: item.date,
        originalMood: (item.mood as SongMood | null | undefined) ?? null,
        currentMood: mood,
      });

      setChoosingMood(false);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "這次的心情沒有儲存成功，請再試一次。",
      );
    } finally {
      setSavingMood(false);
    }
  }

  return (
    <section className="relative mt-4 overflow-hidden rounded-[1.9rem] border border-border/70 bg-card/90 p-4 text-card-foreground shadow-soft">
      <div className="flex items-start gap-4">
        <div className="relative h-[108px] w-[108px] shrink-0" aria-hidden="true">
          <span className="absolute left-0 top-0 flex size-[94px] items-center justify-center rounded-full border border-primary/20 bg-surface shadow-[0_8px_22px_rgba(0,0,0,0.08)]">
            <span className="absolute inset-[12%] rounded-full border border-primary/10" />
            <span className="absolute inset-[27%] rounded-full border border-primary/10" />
            <span className="absolute inset-[40%] rounded-full bg-card ring-1 ring-border/60" />
            <span className="absolute inset-[47%] rounded-full bg-primary/65" />
            <span className="absolute left-[18%] top-[13%] h-[2px] w-[42%] rotate-[-28deg] rounded-full bg-white/70" />
          </span>
          <span className="absolute bottom-0 right-0 flex size-10 rotate-[6deg] items-center justify-center rounded-[0.45rem] border border-border/60 bg-background shadow-soft">
            <MusicDiscIcon className="size-5 text-primary" />
          </span>
        </div>

        <div className="min-w-0 flex-1 pt-1">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-primary">
            {onThisDay ? "ON THIS DAY" : "FOUND AGAIN"}
          </p>
          <h3 className="mt-1.5 font-display text-[20px] font-semibold leading-tight">
            {onThisDay ? "這天聽過的歌" : "又遇見這首歌"}
          </h3>
          <p className="mt-2 truncate text-[16px] font-medium">{item.title}</p>
          <p className="mt-1 truncate text-[12px] text-muted-foreground">
            {item.artist || "我們的歌"}
          </p>
          <p className="mt-2 text-[11px] tracking-[0.05em] text-muted-foreground">
            {formatMemoryDate(item.date)}
            {item.mood ? `  ·  ${item.mood}` : ""}
          </p>
        </div>

        <Link
          to="/music"
          aria-label="打開音樂日記"
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-border/60 bg-background/80 text-primary transition-transform active:scale-90"
        >
          <ArrowRight className="size-3.5" strokeWidth={1.7} />
        </Link>
      </div>
      {savedListenAgain ? (
        <div className="mt-4 border-t border-border/60 pt-4">
          <div className="flex items-center gap-3 text-sm">
            {savedListenAgain.originalMood ? (
              <>
                <span className="text-muted-foreground">
                  THEN
                </span>
                <span className="text-lg">
                  {savedListenAgain.originalMood}
                </span>
                <span className="text-muted-foreground">
                  →
                </span>
              </>
            ) : null}
            <span className="text-muted-foreground">
              NOW
            </span>
            <span className="text-lg">
              {savedListenAgain.currentMood}
            </span>
          </div>

          <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
            同一首歌，現在聽起來已經不一樣了。
          </p>
        </div>
      ) : choosingMood ? (
        <div className="mt-4 border-t border-border/60 pt-4">
          <p className="text-[13px] font-medium">
            現在聽，是什麼心情？
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {SONG_MOOD_OPTIONS.map((mood) => (
              <button
                key={mood}
                type="button"
                disabled={savingMood}
                onClick={() => void chooseNowMood(mood)}
                className="flex size-10 items-center justify-center rounded-full bg-card text-lg shadow-sm transition-transform active:scale-90 disabled:opacity-50"
                aria-label={`現在的心情 ${mood}`}
              >
                {mood}
              </button>
            ))}
          </div>

          {saveError ? (
            <p className="mt-2 text-xs text-destructive">
              {saveError}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border/60 pt-3">
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              onClick={() => setChoosingMood(true)}
              className="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-medium text-primary"
            >
              再聽一次
              <ArrowRight className="size-3.5" />
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setChoosingMood(true)}
              className="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-medium text-primary"
            >
              再聽一次
              <ArrowRight className="size-3.5" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
