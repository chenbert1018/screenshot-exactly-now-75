import type { SongMood } from "./idol-song-journal";

export type ListenAgainEntry = {
  id: string;
  userId: string;
  idolId: string;
  songId: string;
  sourceJournalEntryId: string | null;
  originalDate: string;
  originalMood: SongMood | null;
  listenAgainDate: string;
  currentMood: SongMood;
  createdAt: string;
  updatedAt: string;
};

export type SaveListenAgainInput = {
  songId: string;
  sourceJournalEntryId?: string | null;
  originalDate: string;
  originalMood?: SongMood | null;
  currentMood: SongMood;
};
