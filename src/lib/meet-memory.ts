export type MeetMemory = {
  eventId: string;
  wantedToSay?: string;
  actuallySaid?: string;
  idolMoment?: string;
  afterthought?: string;
  photo?: string;
  createdAt: string;
  updatedAt: string;
};

export type MeetMemoryDraft = {
  wantedToSay: string;
  actuallySaid: string;
  idolMoment: string;
  afterthought: string;
  photo: string;
};

export const emptyMeetMemoryDraft: MeetMemoryDraft = {
  wantedToSay: "",
  actuallySaid: "",
  idolMoment: "",
  afterthought: "",
  photo: "",
};
