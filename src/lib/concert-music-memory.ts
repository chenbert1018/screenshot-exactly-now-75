export type ConcertMusicMemory = {
  id: string;
  userId: string;
  idolId: string;
  eventId: string;
  wantToHearSongId: string | null;
  openingSongId: string | null;
  finallyHeardSongId: string | null;
  tearjerkerSongId: string | null;
  hypeSongId: string | null;
  unforgettableSongId: string | null;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type ConcertMusicMemoryDraft = Pick<
  ConcertMusicMemory,
  "wantToHearSongId" | "openingSongId" | "finallyHeardSongId" | "tearjerkerSongId" | "hypeSongId" | "unforgettableSongId" | "note"
>;

export const emptyConcertMusicMemoryDraft: ConcertMusicMemoryDraft = {
  wantToHearSongId: null,
  openingSongId: null,
  finallyHeardSongId: null,
  tearjerkerSongId: null,
  hypeSongId: null,
  unforgettableSongId: null,
  note: "",
};
