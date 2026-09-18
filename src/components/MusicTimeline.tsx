import { ExternalLink, Music2 } from "lucide-react";
import { streamingLink } from "@/lib/idol-music";
import type { MusicTimelineItem } from "@/lib/music-timeline";

type Props = {
  items: MusicTimelineItem[];
  ready?: boolean;
};

const MONTHS = [
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

function parseDate(value: string) {
  return new Date(
    value.length <= 10
      ? `${value.slice(0, 10)}T00:00:00`
      : value,
  );
}

function monthKey(value: string) {
  const date = parseDate(value);

  if (Number.isNaN(date.getTime())) {
    return "MEMORIES";
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}`;
}

function monthTitle(value: string) {
  const date = parseDate(value);

  if (Number.isNaN(date.getTime())) {
    return "OUR MEMORIES";
  }

  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function shortDate(value: string) {
  const date = parseDate(value);

  if (Number.isNaN(date.getTime())) {
    return {
      month: "",
      day: value.slice(8, 10),
    };
  }

  return {
    month: MONTHS[date.getMonth()].slice(0, 3),
    day: String(date.getDate()).padStart(2, "0"),
  };
}

function kindLabel(kind: MusicTimelineItem["kind"]) {
  switch (kind) {
    case "TODAY_SONG":
      return "TODAY'S SONG";
    case "COMEBACK":
      return "COMEBACK";
    case "CONCERT":
      return "CONCERT";
    case "MEMORY_DAY":
      return "MEMORY";
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
    case "MEMORY_DAY":
      return "♡";
  }
}

export function MusicTimeline({
  items,
  ready = true,
}: Props) {
  if (!ready) {
    return (
      <section className="mt-6">
        <div className="h-40 animate-pulse rounded-[2rem] bg-surface/60" />
      </section>
    );
  }

  const groups = items.reduce<
    Array<{
      key: string;
      title: string;
      items: MusicTimelineItem[];
    }>
  >((result, item) => {
    const key = monthKey(item.date);
    const existing = result.find(
      (group) => group.key === key,
    );

    if (existing) {
      existing.items.push(item);
    } else {
      result.push({
        key,
        title: monthTitle(item.date),
        items: [item],
      });
    }

    return result;
  }, []);

  return (
    <section className="mt-6">
      <div className="mb-5">
        <p className="text-[11px] font-medium tracking-[0.15em] text-primary">
          MY MUSIC DIARY ♡
        </p>

        <h2 className="mt-1 font-display text-[20px] font-semibold">
          我和他的追星音樂日記
        </h2>

        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
          那些日子，後來都有了一首歌。
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[1.8rem] border border-border/60 bg-card/80 px-5 py-7 text-center shadow-soft">
          <Music2
            className="mx-auto size-5 text-primary"
            strokeWidth={1.5}
          />

          <p className="mt-3 text-sm font-medium">
            音樂日記還在等第一首歌
          </p>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Today's Song、Comeback 和演唱會留下的歌，
            <br />
            都會慢慢收進這本日記裡 ♡
          </p>
        </div>
      ) : (
        <div className="space-y-9">
          {groups.map((group) => (
            <div key={group.key}>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="font-display text-[19px] font-semibold tracking-[0.02em]">
                    {group.title}
                  </p>

                  <p className="mt-1 text-[10px] font-medium tracking-[0.13em] text-primary">
                    {group.items.length} MUSIC{" "}
                    {group.items.length === 1
                      ? "MEMORY"
                      : "MEMORIES"}{" "}
                    ♡
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {group.items.map((item) => {
                  const date = shortDate(item.date);

                  return (
                    <article
                      key={item.id}
                      className="flex gap-3"
                    >
                      <div className="w-10 shrink-0 pt-2 text-center">
                        <p className="text-[9px] font-medium tracking-[0.12em] text-muted-foreground">
                          {date.month}
                        </p>

                        <p className="mt-0.5 font-display text-[18px] font-semibold leading-none">
                          {date.day}
                        </p>
                      </div>

                      <div className="min-w-0 flex-1 rounded-[1.7rem] border border-border/60 bg-card/85 px-4 py-4 shadow-soft backdrop-blur-xl">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium tracking-[0.12em] text-primary">
                              {kindLabel(item.kind)} ♡
                            </p>

                            <h3 className="mt-1 truncate text-[14px] font-medium">
                              {item.title}
                            </h3>
                          </div>

                          <span
                            aria-hidden
                            className="shrink-0 text-base"
                          >
                            {kindIcon(item.kind)}
                          </span>
                        </div>

                        {item.subtitle ? (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {item.subtitle}
                          </p>
                        ) : null}

                        {item.songs.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            {item.songs.map(
                              (
                                { role, song },
                                songIndex,
                              ) => {
                                const link =
                                  streamingLink(song);

                                return (
                                  <div
                                    key={`${item.id}-${song.id}-${role}-${songIndex}`}
                                    className="rounded-[1.25rem] bg-surface/60 px-3.5 py-3"
                                  >
                                    <p className="text-[9px] font-medium tracking-[0.08em] text-muted-foreground">
                                      {role}
                                    </p>

                                    <div className="mt-1 flex items-center gap-3">
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-[14px] font-medium">
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

                        {item.mood ? (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-lg">
                              {item.mood}
                            </span>

                            <span className="text-[11px] text-muted-foreground">
                              那天的心情
                            </span>
                          </div>
                        ) : null}

                        {item.note ? (
                          <p className="mt-3 border-t border-border/50 pt-3 text-xs leading-5 text-muted-foreground">
                            {item.note}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
