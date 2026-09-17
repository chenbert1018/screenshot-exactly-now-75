export type RandomSongMemory = {
  id: string;
  songId: string;
  title: string;
  artist?: string | null;
  date?: string | null;
  mood?: string | null;
  appleMusicUrl?: string | null;
  spotifyUrl?: string | null;
};

export function pickRandomSongMemory(
  items: RandomSongMemory[],
  currentId?: string | null,
): RandomSongMemory | null {
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];

  const candidates = currentId
    ? items.filter((item) => item.id !== currentId)
    : items;

  const pool = candidates.length > 0 ? candidates : items;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

export function randomMemoryDateLabel(value?: string | null) {
  if (!value) return null;

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
