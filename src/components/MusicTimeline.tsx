import { ExternalLink, Music2 } from "lucide-react";
import { streamingLink } from "@/lib/idol-music";
import type { MusicTimelineItem } from "@/lib/music-timeline";

type Props = {
  items: MusicTimelineItem[];
  ready?: boolean;
};

function parseDate(value: string) {
  return new Date(
    value.length <= 10
      ? `${value.slice(0, 10)}T00:00:00`
      : value,
  );
}

function dateLabel(value: string) {
  const date = parseDate(value);

  if (Number.isNaN(date.getTime())) return value.slice(0, 10);

  return new Intl.DateTimeFormat("zh-TW", {
    month: "long",
    day: "numeric",
  }).format(date);
}

function yearOf(value: string) {
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) return "MEMORIES";
  return String(date.getFullYear());
}

function kindLabel(kind: MusicTimelineItem["kind"]) {
  switch (kind) {
    case "TODAY_SONG":
      return "TODAY'S SONG";
    case "COMEBACK":
      return "COMEBACK DIARY";
    case "CONCERT":
      return "CONCERT MEMORY";
  }
}

function kindIcon(kind: MusicTimelineItem["kind"]) {
  switch (kind) {
    case "TODAY_SONG":
      return "🎧";
    case "COMEBACK":
      return "💿";
    case "CONCERT":
      return "🎤";
  }
}

export function MusicTimeline({ items, ready = true }: Props) {
  if (!ready) {
    return (
      <section className="mt-7">
        <div className="mb-3">
          <p className="text-[11px] font-medium tracking-[0.13em] text-primary">
            MUSIC TIMELINE ♡
          </p>
          <h2 className="mt-1 font-display text-[18px] font-semibold">
            我們的音樂時間線
          </h2>
        </div>

        <div className="h-36 animate-pulse rounded-3xl bg-surface/60" />
      </section>
    );
  }

  const groups = items.reduce<Record<string, MusicTimelineItem[]>>(
    (result, item) => {
      const year = yearOf(item.date);
      (result[year] ??= []).push(item);
      return result;
    },
    {},
  );

  return (
    <section className="mt-7">
      <div className="mb-4">
        <p className="text-[11px] font-medium tracking-[0.13em] text-primary">
          MUSIC TIMELINE ♡
        </p>

        <h2 className="mt-1 font-display text-[18px] font-semibold">
          我們的音樂時間線
        </h2>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          喜歡他的日子，也慢慢變成了一首一首的歌。
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[1.8rem] border border-border/60 bg-card/80 px-5 py-6 text-center shadow-soft">
          <Music2
            className="mx-auto size-5 text-primary"
            strokeWidth={1.5}
          />

          <p className="mt-3 text-sm font-medium">
            時間線還在等第一首歌
          </p>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Today's Song、Comeback 或演唱會留下的音樂記憶，都會慢慢出現在這裡 ♡
          </p>
        </div>
      ) : (
        Object.entries(groups).map(([year, yearItems]) => (
          <div key={year} className="mb-8 last:mb-0">
            <div className="mb-4 flex items-end gap-2">
              <span className="font-display text-[25px] font-semibold">
                {year}
              </span>

              <span className="pb-1 text-[10px] font-medium tracking-[0.15em] text-primary">
                OUR MUSIC ♡
              </span>
            </div>

            <div className="relative ml-2 border-l border-primary/20 pl-5">
              {yearItems.map((item, index) => (
                <article
                  key={item.id}
                  className={
                    index === yearItems.length - 1
                      ? "relative pb-1"
                      : "relative pb-6"
                  }
                >
                  <span
                    aria-hidden
                    className="absolute -left-[1.72rem] top-1 flex size-5 items-center justify-center rounded-full border border-primary/25 bg-background text-[10px]"
                  >
                    {kindIcon(item.kind)}
                  </span>

                  <div className="rounded-[1.65rem] border border-border/60 bg-card/85 px-4 py-4 shadow-soft backdrop-blur-xl">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium tracking-[0.12em] text-primary">
                          {kindLabel(item.kind)}
                        </p>

                        <h3 className="mt-1 text-[15px] font-medium">
                          {item.title}
                        </h3>
                      </div>

                      <time className="shrink-0 text-[10px] text-muted-foreground">
                        {dateLabel(item.date)}
                      </time>
                    </div>

                    {item.subtitle ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.subtitle}
                      </p>
                    ) : null}

                    {item.mood ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        那天的心情：{item.mood}
                      </p>
                    ) : null}

                    {item.songs.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {item.songs.map(
                          ({ role, song }, songIndex) => {
                            const link = streamingLink(song);

                            return (
                              <div
                                key={`${item.id}-${song.id}-${role}-${songIndex}`}
                                className="rounded-2xl bg-surface/60 px-3.5 py-3"
                              >
                                <p className="text-[10px] text-muted-foreground">
                                  {role}
                                </p>

                                <div className="mt-1 flex items-center gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                      ♪ {song.title}
                                    </p>

                                    {song.artist ? (
                                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                        {song.artist}
                                      </p>
                                    ) : null}
                                  </div>

                                  {link ? (
                                    <a
                                      href={link}
                                      target="_blank"
                                      rel="noreferrer"
                                      aria-label={`播放 ${song.title}`}
                                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                                    >
                                      <ExternalLink className="size-3.5" />
                                    </a>
                                  ) : null}
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    ) : null}

                    {item.note ? (
                      <p className="mt-3 border-t border-border/50 pt-3 text-xs leading-5 text-muted-foreground">
                        {item.note}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
