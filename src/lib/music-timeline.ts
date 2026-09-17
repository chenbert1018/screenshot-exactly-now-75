import type { IdolSong } from "./idol-music";
import type { IdolSongJournalEntry } from "./idol-song-journal";
import type { ComebackDiary } from "./comeback-diary";
import type { ConcertMusicMemory } from "./concert-music-memory";

export type MusicTimelineKind = "TODAY_SONG" | "COMEBACK" | "CONCERT";

export type MusicTimelineSong = {
  role: string;
  song: IdolSong;
};

export type MusicTimelineItem = {
  id: string;
  kind: MusicTimelineKind;
  date: string;
  title: string;
  subtitle?: string;
  mood?: string | null;
  note?: string;
  songs: MusicTimelineSong[];
};

function songById(songs: IdolSong[], id?: string | null) {
  if (!id) return undefined;
  return songs.find((song) => song.id === id);
}

function addSong(
  target: MusicTimelineSong[],
  songs: IdolSong[],
  id: string | null | undefined,
  role: string,
) {
  const song = songById(songs, id);
  if (song) target.push({ role, song });
}

export function buildMusicTimeline(input: {
  songs: IdolSong[];
  journalEntries: IdolSongJournalEntry[];
  comebackDiaries: ComebackDiary[];
  concertMemories: ConcertMusicMemory[];
}): MusicTimelineItem[] {
  const {
    songs,
    journalEntries,
    comebackDiaries,
    concertMemories,
  } = input;

  const items: MusicTimelineItem[] = [];

  for (const entry of journalEntries) {
    const song = songById(songs, entry.songId);
    if (!song) continue;

    items.push({
      id: `today-${entry.id}`,
      kind: "TODAY_SONG",
      date: entry.entryDate,
      title: "今天和他一起聽的歌",
      mood: entry.mood,
      songs: [{ role: "TODAY'S SONG", song }],
    });
  }

  for (const diary of comebackDiaries) {
    const diarySongs: MusicTimelineSong[] = [];

    addSong(diarySongs, songs, diary.firstFavoriteSongId, "第一耳最喜歡");
    addSong(diarySongs, songs, diary.laterFavoriteSongId, "後來最喜歡");
    addSong(diarySongs, songs, diary.wantToHearLiveSongId, "最想現場聽");

    if (diarySongs.length === 0 && !diary.note) continue;

    items.push({
      id: `comeback-${diary.id}`,
      kind: "COMEBACK",
      date: diary.createdAt,
      title: "Comeback Diary",
      subtitle:
        diary.firstListenRating != null
          ? `第一耳 ${diary.firstListenRating}/5`
          : undefined,
      note: diary.note,
      songs: diarySongs,
    });
  }

  for (const memory of concertMemories) {
    const memorySongs: MusicTimelineSong[] = [];

    addSong(memorySongs, songs, memory.wantToHearSongId, "最期待現場聽");
    addSong(memorySongs, songs, memory.openingSongId, "第一首歌");
    addSong(memorySongs, songs, memory.finallyHeardSongId, "終於現場聽到了");
    addSong(memorySongs, songs, memory.tearjerkerSongId, "最好哭的一首");
    addSong(memorySongs, songs, memory.hypeSongId, "全場最嗨的一首");
    addSong(memorySongs, songs, memory.unforgettableSongId, "最忘不了的一首");

    if (memorySongs.length === 0 && !memory.note) continue;

    items.push({
      id: `concert-${memory.id}`,
      kind: "CONCERT",
      date: memory.createdAt,
      title: "Concert Music Memory",
      subtitle: "MY CONCERT SOUNDTRACK",
      note: memory.note,
      songs: memorySongs,
    });
  }

  return items.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}
