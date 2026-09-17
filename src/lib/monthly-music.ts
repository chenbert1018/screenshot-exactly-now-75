import type { IdolSong } from "./idol-music";
import type { MusicTimelineItem } from "./music-timeline";

export type MusicMonth = {
  year: number;
  month: number;
};

export type MonthlyMusicSummary = MusicMonth & {
  todaySongCount: number;
  comebackCount: number;
  concertCount: number;
  memoryCount: number;
  uniqueSongCount: number;
  songOfTheMonth: {
    song: IdolSong;
    count: number;
  } | null;
};

function parseTimelineDate(value: string) {
  const date = new Date(
    value.length <= 10
      ? `${value.slice(0, 10)}T00:00:00`
      : value,
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

export function availableMusicMonths(
  items: MusicTimelineItem[],
): MusicMonth[] {
  const keys = new Set<string>();

  for (const item of items) {
    const date = parseTimelineDate(item.date);
    if (!date) continue;

    keys.add(
      `${date.getFullYear()}-${date.getMonth() + 1}`,
    );
  }

  return [...keys]
    .map((key) => {
      const [year, month] = key.split("-").map(Number);
      return { year, month };
    })
    .sort(
      (a, b) =>
        b.year - a.year ||
        b.month - a.month,
    );
}

export function buildMonthlyMusic(
  items: MusicTimelineItem[],
  year: number,
  month: number,
): MonthlyMusicSummary {
  const monthItems = items.filter((item) => {
    const date = parseTimelineDate(item.date);

    return (
      date &&
      date.getFullYear() === year &&
      date.getMonth() + 1 === month
    );
  });

  const songCounts = new Map<
    string,
    { song: IdolSong; count: number }
  >();

  for (const item of monthItems) {
    for (const { song } of item.songs) {
      const existing = songCounts.get(song.id);

      if (existing) {
        existing.count += 1;
      } else {
        songCounts.set(song.id, {
          song,
          count: 1,
        });
      }
    }
  }

  const rankedSongs = [...songCounts.values()].sort(
    (a, b) =>
      b.count - a.count ||
      a.song.title.localeCompare(b.song.title),
  );

  return {
    year,
    month,
    todaySongCount: monthItems.filter(
      (item) => item.kind === "TODAY_SONG",
    ).length,
    comebackCount: monthItems.filter(
      (item) => item.kind === "COMEBACK",
    ).length,
    concertCount: monthItems.filter(
      (item) => item.kind === "CONCERT",
    ).length,
    memoryCount: monthItems.length,
    uniqueSongCount: songCounts.size,
    songOfTheMonth: rankedSongs[0] ?? null,
  };
}
