export type ComebackDiary = {
  id: string;
  userId: string;
  idolId: string;
  eventId: string;
  firstListenRating: number | null;
  firstFavoriteSongId: string | null;
  laterFavoriteSongId: string | null;
  wantToHearLiveSongId: string | null;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type ComebackDiaryDraft = Pick<
  ComebackDiary,
  "firstListenRating" | "firstFavoriteSongId" | "laterFavoriteSongId" | "wantToHearLiveSongId" | "note"
>;

export const emptyComebackDiaryDraft: ComebackDiaryDraft = {
  firstListenRating: null,
  firstFavoriteSongId: null,
  laterFavoriteSongId: null,
  wantToHearLiveSongId: null,
  note: "",
};
