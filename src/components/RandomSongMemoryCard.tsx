import { useEffect, useMemo, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import {
  pickRandomSongMemory,
  randomMemoryDateLabel,
  type RandomSongMemory,
} from "@/lib/random-song-memory";

type Props = {
  items: RandomSongMemory[];
  ready?: boolean;
};

export function RandomSongMemoryCard({ items, ready = true }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (items.length === 0) return null;

    if (selectedId) {
      const existing = items.find((item) => item.id === selectedId);
      if (existing) return existing;
    }

    return pickRandomSongMemory(items);
  }, [items, selectedId]);

  useEffect(() => {
    if (selected && selected.id !== selectedId) {
      setSelectedId(selected.id);
    }
  }, [selected, selectedId]);

  const changeSong = () => {
    const next = pickRandomSongMemory(items, selected?.id);
    if (next) setSelectedId(next.id);
  };

  if (!ready) {
    return (
      <section className="rounded-[1.8rem] border border-border/70 bg-card/85 px-5 py-6 shadow-soft">
        <div className="h-20 animate-pulse rounded-2xl bg-surface" />
      </section>
    );
  }

  if (!selected) {
    return (
      <section className="rounded-[1.8rem] border border-border/70 bg-card/85 px-5 py-6 shadow-soft">
        <p className="text-[11px] font-medium tracking-[0.13em] text-primary">
          RANDOM MEMORY ♡
        </p>
        <h3 className="mt-2 font-display text-[18px] font-semibold">
          以前的歌，再聽一次
        </h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          等你留下幾首歌之後，我會偶爾把以前的心情帶回來給你 ♡
        </p>
      </section>
    );
  }

  const dateLabel = randomMemoryDateLabel(selected.date);
  const listenUrl = selected.appleMusicUrl || selected.spotifyUrl;

  return (
    <section className="rounded-[1.8rem] border border-border/70 bg-card/85 px-5 py-6 shadow-soft backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.13em] text-primary">
            RANDOM MEMORY ♡
          </p>
          <h3 className="mt-2 font-display text-[18px] font-semibold">
            以前的歌，再聽一次
          </h3>
        </div>

        {items.length > 1 ? (
          <button
            type="button"
            onClick={changeSong}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-muted-foreground transition-transform active:scale-95"
            aria-label="換一首"
          >
            <RefreshCw className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-5 rounded-2xl bg-surface/70 px-4 py-4">
        <p className="font-display text-[17px] font-semibold">
          ♪ {selected.title}
        </p>

        {selected.artist ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {selected.artist}
          </p>
        ) : null}

        {dateLabel || selected.mood ? (
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {dateLabel ? `${dateLabel} 的你` : "以前的你"}
            {selected.mood ? `・${selected.mood}` : ""}
          </p>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            以前的你，曾經留下這首歌。
          </p>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        {listenUrl ? (
          <a
            href={listenUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform active:scale-95"
          >
            再聽一次
            <ExternalLink className="size-3.5" />
          </a>
        ) : (
          <div className="flex-1 rounded-full bg-surface px-4 py-2.5 text-center text-xs text-muted-foreground">
            這首歌的回憶還在這裡 ♡
          </div>
        )}

        {items.length > 1 ? (
          <button
            type="button"
            onClick={changeSong}
            className="rounded-full border border-border/70 px-4 py-2.5 text-xs transition-transform active:scale-95"
          >
            換一首
          </button>
        ) : null}
      </div>
    </section>
  );
}
