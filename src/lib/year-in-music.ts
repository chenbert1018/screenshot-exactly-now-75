import type { MusicTimelineItem } from "./music-timeline";
import type { IdolSong } from "./idol-music";

export type YearInMusicSong = {
  song: IdolSong;
  count: number;
};

export type YearInMusicSummary = {
  year: number;
  todaySongCount: number;
  comebackCount: number;
  concertCount: number;
  memoryCount: number;
  uniqueSongCount: number;
  mostRememberedSong: YearInMusicSong | null;
};

function yearOf(value: string) {
  const date = new Date(
    value.length <= 10
      ? `${value.slice(0, 10)}T00:00:00`
      : value,
  );

  return Number.isNaN(date.getTime())
    ? null
    : date.getFullYear();
}

export function buildYearInMusic(
  items: MusicTimelineItem[],
  year: number,
): YearInMusicSummary {
  const yearItems = items.filter(
    (item) => yearOf(item.date) === year,
  );

  const songCounts = new Map<
    string,
    { song: IdolSong; count: number }
  >();

  for (const item of yearItems) {
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
    todaySongCount: yearItems.filter(
      (item) => item.kind === "TODAY_SONG",
    ).length,
    comebackCount: yearItems.filter(
      (item) => item.kind === "COMEBACK",
    ).length,
    concertCount: yearItems.filter(
      (item) => item.kind === "CONCERT",
    ).length,
    memoryCount: yearItems.length,
    uniqueSongCount: songCounts.size,
    mostRememberedSong: rankedSongs[0] ?? null,
  };
}

export function availableMusicYears(
  items: MusicTimelineItem[],
) {
  return [
    ...new Set(
      items
        .map((item) => yearOf(item.date))
        .filter((year): year is number => year != null),
    ),
  ].sort((a, b) => b - a);
}
