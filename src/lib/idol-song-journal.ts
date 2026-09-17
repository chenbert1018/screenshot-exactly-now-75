export const SONG_MOOD_OPTIONS = ["🥹", "💗", "😭", "✨", "🔥"] as const;

export type SongMood = (typeof SONG_MOOD_OPTIONS)[number];

export type IdolSongJournalEntry = {
  id: string;
  userId: string;
  idolId: string;
  songId: string | null;
  /** Local calendar day (YYYY-MM-DD), not the server timestamp. */
  entryDate: string;
  mood: SongMood | null;
  createdAt: string;
  updatedAt: string;
};

export function localDateKey(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
