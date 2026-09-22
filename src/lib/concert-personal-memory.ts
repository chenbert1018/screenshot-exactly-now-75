export type ConcertPersonalMemory = {
  eventId: string;
  seat?: string;
  unforgettableMoment?: string;
  photo?: string;
  createdAt: string;
  updatedAt: string;
};

export type ConcertPersonalMemoryDraft = {
  seat: string;
  unforgettableMoment: string;
  photo: string;
};

export const emptyConcertPersonalMemoryDraft: ConcertPersonalMemoryDraft = {
  seat: "",
  unforgettableMoment: "",
  photo: "",
};
