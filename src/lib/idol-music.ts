export const SONG_ROLE_OPTIONS = [
  ["FIRST_FANDOM", "我們的第一首歌"],
  ["FAVORITE", "我的入坑曲"],
  ["FIRST_CONCERT", "最想現場聽"],
  ["WANT_TO_HEAR_LIVE", "聽到會想到他的歌"],
  ["ON_REPEAT", "今年播放最多"],
  ["THINK_OF_THEM", "最近的心情"],
] as const;

export type SongRole = (typeof SONG_ROLE_OPTIONS)[number][0];

export type IdolSong = {
  id: string;
  idolId: string;
  title: string;
  artist: string;
  album: string;
  appleMusicUrl: string;
  spotifyUrl: string;
  isTodayPick: boolean;
  createdAt: string;
};

export type IdolSongDraft = Omit<IdolSong, "id" | "idolId" | "isTodayPick" | "createdAt">;

export type IdolSongRole = {
  id: string;
  idolId: string;
  songId: string;
  role: SongRole;
};

export const emptyIdolSongDraft: IdolSongDraft = {
  title: "",
  artist: "",
  album: "",
  appleMusicUrl: "",
  spotifyUrl: "",
};

export function songRoleLabel(role: SongRole) {
  return SONG_ROLE_OPTIONS.find(([value]) => value === role)?.[1] ?? "我們的歌";
}

export function streamingLink(song: Pick<IdolSong, "appleMusicUrl" | "spotifyUrl">) {
  return song.appleMusicUrl.trim() || song.spotifyUrl.trim() || "";
}
