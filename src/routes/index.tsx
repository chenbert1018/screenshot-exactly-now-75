import { StoredImage } from "@/components/StoredImage";
import { IdolSongFormSheet } from "@/components/IdolSongFormSheet";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  CloudSun,
  Heart,
  History,
  ImageIcon,
  Plus,
  Repeat2,
  Search,
} from "lucide-react";
import { AppShell, EmptyState, Section } from "@/components/AppShell";
import type { Idol } from "@/lib/idols";
import { useIdolSource } from "@/lib/idols.source";
import { canUseFanWeather, eventCountdown, nextEvent, type IdolEvent } from "@/lib/events";
import { useEventSource } from "@/lib/events.source";
import { useArchaeologySource } from "@/lib/archaeology.source";
import { useMemorySource } from "@/lib/memories.source";
import { useIdolMusicSource } from "@/lib/idol-music.source";
import {
  streamingLink,
  type IdolSong,
  type IdolSongDraft,
} from "@/lib/idol-music";
import { useSongJournalHistory, useTodaySongJournal } from "@/lib/idol-song-journal.source";
import {
  SONG_MOOD_OPTIONS,
  type IdolSongJournalEntry,
  type SongMood,
} from "@/lib/idol-song-journal";
import { RandomSongMemoryCard } from "@/components/RandomSongMemoryCard";
import { daysSince, nextAnniversary } from "@/lib/dates";
import { classifyFanWeather, type FanWeatherInput } from "@/lib/fan-weather";
import { TodaySongIcon, DDayIcon, ComebackIcon, ConcertTicketIcon } from "@/components/IdolDaysIcons";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IdolDays｜偶像專屬倒數日" },
      {
        name: "description",
        content: "IdolDays 是為 KPOP 粉絲打造的私人陪伴 App，收藏你喜歡一個人的日子。",
      },
      { property: "og:title", content: "IdolDays｜偶像專屬倒數日" },
      { property: "og:description", content: "不是在倒數日子，而是在收藏我喜歡一個人的日子。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function dotDate(value: string) {
  return value.replaceAll("-", ".");
}

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "좋은 아침이에요 ♡";
  if (hour < 18) return "좋은 오후예요 ♡";
  return "좋은 밤이에요 ♡";
}

const ANIMAL_DAILY_LINES = {
  CAT: ["不准忘記照顧自己，追星也要漂亮從容。", "行程帶好，其他交給期待就好。"],
  DOG: ["今天也要元氣滿滿地出發！", "走吧，今天也一起發光。"],
  RABBIT: ["慢慢準備也沒關係，今天會是可愛的一天。", "帶著好心情，溫柔地去見喜歡的人吧。"],
  FOX: ["行程確認好，漂亮地去見喜歡的人吧。", "票券、手燈、心意，全部準備得剛剛好。"],
  HAMSTER: ["小小的期待也要裝滿，今天會很療癒。", "補充好心情和體力，再開心出發吧。"],
  TIGER: ["把最強的氣勢留給今天，全力應援吧。", "準備好了就出發，今天的舞台值得期待。"],
  LION: ["抬頭出發，今天也帶著王者般的自信。", "安靜蓄力，到了舞台就盡情發光。"],
  DEER: ["帶著清澈的好心情，輕輕走向期待。", "今天也溫柔閃亮地去見喜歡的人吧。"],
  CHIPMUNK: ["期待和小點心都裝好，元氣出發！", "先補滿能量，今天也要開心收藏回憶。"],
  PENGUIN: ["照自己的步調慢慢走，也會可愛地抵達。", "外表冷靜，心裡的期待要好好帶上。"],
  WOLF: ["帶好裝備，安靜地把期待做到最好。", "今天也穩穩地，奔向你想見的人。"],
} as const;

/** 依本地日期輪換；優先使用這位偶像的代表動物。 */
function dailyAnimalLine(idol: Idol) {
  const date = new Date();
  const seed = date.getFullYear() * 372 + (date.getMonth() + 1) * 31 + date.getDate();
  const animal = idol.representativeAnimal ?? "DOG";
  const lines = ANIMAL_DAILY_LINES[animal];
  return lines[seed % lines.length];
}

function dayLabel(event: IdolEvent) {
  const days = eventCountdown(event.date)?.daysUntil ?? 0;
  return days === 0 ? "今天" : `D-${Math.max(0, days)}`;
}

function TodayEventMomentCard({ event }: { event: IdolEvent }) {
  const meta = event.type === "COMEBACK"
    ? { icon: "💿", eyebrow: "今天回歸 ♡", line: "第一個感覺，也值得替自己留下來。" }
    : event.type === "CONCERT"
      ? { icon: "🎤", eyebrow: "今天見面了 ♡", line: "一張照片、一個瞬間，先替今天留住。" }
      : event.type === "FAN_MEETING"
        ? { icon: "💌", eyebrow: "今天見到他 ♡", line: "最想說的話、他的反應，都可以留在今天。" }
        : null;
  if (!meta) return null;

  return (
    <Link
      to="/events"
      className="mt-3 flex min-h-[72px] items-center gap-3 rounded-[1.55rem] border border-primary/20 bg-primary/[0.07] px-4 py-3.5 shadow-soft transition-transform active:scale-[0.99]"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-[20px]">{meta.icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-primary">{meta.eyebrow}</span>
        <span className="mt-0.5 block truncate text-sm font-medium text-foreground">{event.title}</span>
        <span className="mt-0.5 block text-[12px] text-muted-foreground">{meta.line}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-primary" strokeWidth={1.8} />
    </Link>
  );
}

function EventCard({ event }: { event: IdolEvent }) {
  return (
    <Link
      to="/events"
      className="mt-3 flex items-center gap-4 rounded-[1.8rem] border border-border/70 bg-card/90 text-card-foreground px-5 py-4 shadow-soft backdrop-blur-xl transition-transform active:scale-[0.99]"
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <DDayIcon className="size-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium tracking-[0.1em] text-primary uppercase">
          下一個 D-DAY
        </p>
        <p className="mt-1 truncate text-[17px] font-medium">{event.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{dotDate(event.date)}</p>
      </div>
      <p className="shrink-0 font-display text-[35px] leading-none text-primary">
        {dayLabel(event)}
      </p>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <ArrowRight className="size-4" strokeWidth={2} />
      </span>
    </Link>
  );
}

type HomeWeatherResponse = { ok: true; weather: FanWeatherInput } | { ok: false; error?: string };

function FanWeatherCard({ event }: { event: IdolEvent }) {
  const days = eventCountdown(event.date)?.daysUntil ?? 0;
  const timing = days === 0 ? "今天" : `${Math.max(0, days)} 天後`;
  const place = event.locationName?.trim() || event.city?.trim() || event.title;
  const [input, setInput] = useState<FanWeatherInput | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "waiting" | "error">("loading");

  useEffect(() => {
    if (!event.city?.trim()) {
      setStatus("error");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    const params = new URLSearchParams({
      city: event.city.trim(),
      date: event.date.slice(0, 10),
    });
    void fetch(`/api/weather?${params.toString()}`, {
      headers: { "Cache-Control": "no-cache" },
    })
      .then(async (response) => {
        const data = (await response.json()) as HomeWeatherResponse;
        if (cancelled) return;
        if (response.ok && data.ok) {
          setInput(data.weather);
          setStatus("ready");
        } else {
          setInput(null);
          setStatus(
            !data.ok && data.error === "forecast date is outside available range"
              ? "waiting"
              : "error",
          );
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [event.id, event.city, event.date]);

  const result = input ? classifyFanWeather(input) : null;
  const detail =
    status === "ready" && input && result
      ? `${result.emoji} ${result.label}・${input.minTemp}–${input.maxTemp}°C・降雨 ${input.rainProbability}%`
      : status === "waiting"
        ? "還沒到預報範圍，接近活動時會為你準備 ♡"
        : status === "error"
          ? `暫時看不到 ${place} 的天氣，晚點再看看 ♡`
          : "正在確認活動當天的天氣…";

  return (
    <Link
      to="/weather/$eventId"
      params={{ eventId: event.id }}
      className="mt-2.5 flex min-h-[60px] items-center gap-3 rounded-[1.45rem] border border-border/70 bg-card/80 px-4 py-2.5 text-card-foreground shadow-soft backdrop-blur-xl transition-transform active:scale-[0.99]"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/60 text-primary">
        <CloudSun className="size-5" strokeWidth={1.45} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium tracking-[0.06em] text-primary">
          追星天氣・{place}
        </p>
        <p className="mt-1 truncate text-[15px] text-muted-foreground">{timing}・{detail}</p>
      </div>
      <ArrowRight className="size-5 shrink-0 text-primary" strokeWidth={1.8} />
    </Link>
  );
}

function ArchaeologyCard({
  item,
}: {
  item: { title: string; imageUrl?: string | undefined; createdAt: string; collection: string };
}) {
  return (
    <Link
      to="/archaeology"
      className="mt-3 flex items-center gap-4 rounded-[1.8rem] border border-border/70 bg-card/90 text-card-foreground p-3 shadow-soft backdrop-blur-xl transition-transform active:scale-[0.99]"
    >
      <div className="flex size-[5.2rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary">
        {item.imageUrl ? (
          <StoredImage src={item.imageUrl} alt="" className="size-full object-cover" />
        ) : (
          <Search className="size-7" strokeWidth={1.5} />
        )}
      </div>
      <div className="min-w-0 flex-1 py-1">
        <p className="text-[14px] font-medium tracking-[0.06em] text-primary">那時候的我們 ♡</p>
        <p className="mt-1 truncate text-[17px] font-medium">{item.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {dotDate(item.createdAt.slice(0, 10))}
          {item.collection ? `・${item.collection}` : ""}
        </p>
      </div>
      <ArrowRight className="mr-1 size-5 shrink-0 text-primary" strokeWidth={1.8} />
    </Link>
  );
}

function MemoryCard({
  memory,
  song,
}: {
  memory: { title: string; note: string; photo?: string | undefined; date: string };
  song?: IdolSong | undefined;
}) {
  const text = memory.title.trim() || memory.note.trim() || "那天也好想你 ♡";
  const link = song ? streamingLink(song) : "";
  return (
    <section className="mt-3 overflow-hidden rounded-[1.8rem] border border-border/70 bg-card/90 text-card-foreground shadow-soft backdrop-blur-xl">
      <Link
        to="/memories"
        className="flex items-center gap-4 p-3 transition-transform active:scale-[0.99]"
      >
        <div className="flex size-[5.2rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary">
          {memory.photo ? (
            <StoredImage src={memory.photo} alt="" className="size-full object-cover" />
          ) : (
            <History className="size-7" strokeWidth={1.45} />
          )}
        </div>
        <div className="min-w-0 flex-1 py-1">
          <p className="text-[13px] font-medium text-primary">▣ 去年的今天</p>
          <p className="mt-1 text-[17px] font-medium">
            {song ? "一年前，你第一次在現場聽到這首歌。" : dotDate(memory.date)}
          </p>
          <p className="mt-1 truncate text-sm text-muted-foreground">{text}</p>
        </div>
        <ArrowRight className="mr-1 size-5 shrink-0 text-primary" strokeWidth={1.8} />
      </Link>
      {song ? (
        <div className="border-t border-border/60 px-4 py-3">
          <p className="text-sm text-primary">
            🎵 {song.title}
            {song.artist ? ` · ${song.artist}` : ""}
          </p>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              🎧 再聽一次
            </a>
          ) : (
            <Link
              to="/music"
              className="mt-2 inline-flex rounded-full bg-surface px-3 py-1.5 text-xs text-muted-foreground"
            >
              加入串流連結後再聽一次
            </Link>
          )}
        </div>
      ) : null}
    </section>
  );
}

type TodaySongSpecialDay =
  | "birthday"
  | "debut"
  | "our-day"
  | null;

function TodaySongCard({
  idolName,
  idolPhoto,
  idolCutoutPhoto,
  songs,
  entry,
  save,
  addSong,
  musicDays,
  specialDay,
}: {
  idolName: string;
  idolPhoto?: string | undefined;
  idolCutoutPhoto?: string | undefined;
  songs: IdolSong[];
  entry: IdolSongJournalEntry | null;
  musicDays: number;
  specialDay: TodaySongSpecialDay;
  save: (patch: {
    songId?: string | null;
    mood?: SongMood | null;
  }) => Promise<void>;
  addSong: (draft: IdolSongDraft) => Promise<IdolSong>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const fallbackSong = songs.find((song) => song.isTodayPick);
  const selectedSong =
    songs.find((song) => song.id === entry?.songId) ?? fallbackSong;
  const selectedSongId = entry?.songId ?? fallbackSong?.id ?? "";

  const specialDayCopy =
    specialDay === "birthday"
      ? {
          label: "生日這天的歌 ♡",
          empty: `今天是 ${idolName} 的生日 ♡ 想選哪一首歌陪他過今天？`,
          selected: `今天是 ${idolName} 的生日 ♡`,
          companion: "今天這首歌，也會留在我們的生日回憶裡。",
        }
      : specialDay === "debut"
        ? {
            label: "出道紀念日的歌 ♡",
            empty: `今天是 ${idolName} 的出道紀念日 ♡ 想用哪一首歌記住今天？`,
            selected: `今天是 ${idolName} 的出道紀念日 ♡`,
            companion: "今天這首歌，也會留在我們的出道紀念回憶裡。",
          }
        : specialDay === "our-day"
          ? {
              label: "我們這天的歌 ♡",
              empty: `今天是你開始喜歡 ${idolName} 的紀念日 ♡ 想留下哪一首歌？`,
              selected: `今天是你和 ${idolName} 的特別日子 ♡`,
              companion: "今天這首歌，也會留在我們一起走過的日子裡。",
            }
          : null;

  async function update(patch: {
    songId?: string | null;
    mood?: SongMood | null;
  }) {
    setSaving(true);
    setError("");

    try {
      await save(patch);
    } catch {
      setError(
        "今天的音樂日記沒有儲存成功，請確認網路後再試一次。",
      );
    } finally {
      setSaving(false);
    }
  }

  async function chooseSong(songId: string) {
    setSaving(true);
    setError("");

    try {
      await save({ songId });
      setPickerOpen(false);
    } catch {
      setError(
        "今天的音樂日記沒有儲存成功，請確認網路後再試一次。",
      );
    } finally {
      setSaving(false);
    }
  }

  async function createAndChooseSong(draft: IdolSongDraft) {
    setError("");

    try {
      const song = await addSong(draft);
      await save({ songId: song.id });
      setPickerOpen(false);
    } catch (cause) {
      setError("歌曲沒有新增成功，請確認網路後再試一次。");
      throw cause;
    }
  }

  return (
    <section
      className={`music-player-card mt-3 overflow-hidden rounded-[1.9rem] border border-border/70 bg-card/90 p-4 text-card-foreground shadow-soft backdrop-blur-xl ${
        specialDay ? `music-player-card--${specialDay}` : ""
      }`}
    >
      {specialDay === "birthday" ? (
        <>
          <div className="music-birthday-ribbon" aria-hidden="true">
            <span className="music-birthday-ribbon-tail music-birthday-ribbon-tail--left" />
            <span className="music-birthday-ribbon-tail music-birthday-ribbon-tail--right" />

            <span className="music-birthday-bow">
              <span className="music-birthday-bow-loop music-birthday-bow-loop--left" />
              <span className="music-birthday-bow-loop music-birthday-bow-loop--right" />
              <span className="music-birthday-bow-knot" />
            </span>

            <span className="music-birthday-tag-string" />
            <span className="music-birthday-tag">HBD</span>
          </div>

          <span
            aria-hidden="true"
            className="music-birthday-spark music-birthday-spark--one"
          >
            ✦
          </span>
          <span
            aria-hidden="true"
            className="music-birthday-spark music-birthday-spark--two"
          >
            ♡
          </span>
        </>
      ) : specialDay ? (
        <div className="music-special-day-mark" aria-hidden="true">
          <span className="music-special-day-line" />
          <span className="music-special-day-symbol">
            {specialDay === "debut" ? "✦" : "♪"}
          </span>
        </div>
      ) : null}

      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-1 -top-1 text-[13px] text-primary/60"
        >
          ✦
        </span>

        <div className="flex items-start gap-4">
          <button
            type="button"
            disabled={saving}
            onClick={() => setPickerOpen(true)}
            aria-label={selectedSong ? "更換今天的歌曲" : "選擇今天的歌曲"}
            className="music-album-visual group relative h-[102px] w-[116px] shrink-0 disabled:opacity-50"
          >
            <span
              aria-hidden="true"
              className={`music-album-disc music-disc absolute right-0 top-[9px] size-[84px] rounded-full border border-primary/20 ${
                selectedSong ? "music-disc--active" : ""
              }`}
            >
              <span className="absolute inset-[13%] rounded-full border border-primary/10" />
              <span className="absolute inset-[29%] rounded-full border border-primary/10" />
              <span className="absolute inset-[42%] rounded-full bg-card shadow-[0_0_0_1px_var(--border)]" />
              <span className="absolute inset-[47%] rounded-full bg-primary/60" />
              <span className="music-disc-shine absolute inset-0 rounded-full" />
            </span>

            <span className="music-photocard absolute bottom-0 left-0 z-10 h-[96px] w-[72px] overflow-hidden rounded-[0.8rem] border border-border/70 bg-surface shadow-soft">
              {specialDay === "birthday" ? (
                <span className="music-birthday-hat" aria-hidden="true">
                  <span className="music-birthday-hat-pom" />
                  <span className="music-birthday-hat-cone">
                    <span className="music-birthday-hat-stripe music-birthday-hat-stripe--one" />
                    <span className="music-birthday-hat-stripe music-birthday-hat-stripe--two" />
                  </span>
                </span>
              ) : null}
              {idolCutoutPhoto ? (
                <>
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-b from-primary/10 via-surface/40 to-card"
                  />
                  <StoredImage
                    src={idolCutoutPhoto}
                    alt={`${idolName} 的照片`}
                    className="relative z-10 size-full object-contain object-bottom"
                  />
                </>
              ) : idolPhoto ? (
                <StoredImage
                  src={idolPhoto}
                  alt={`${idolName} 的照片`}
                  className="size-full object-cover object-center"
                />
              ) : (
                <span className="flex size-full items-center justify-center font-display text-[22px] text-primary">
                  {idolName.trim().slice(0, 1) || "♡"}
                </span>
              )}

              <span
                aria-hidden="true"
                className="absolute bottom-1.5 right-2 z-20 text-[9px] text-primary/80"
              >
                ♡
              </span>

              {specialDay === "birthday" ? (
                <span
                  aria-hidden="true"
                  className="music-birthday-photo-note"
                >
                  Happy
                  <br />
                  Birthday ♡
                </span>
              ) : null}
            </span>

            <span
              aria-hidden="true"
              className="absolute left-[65px] top-0 z-20 text-[11px] text-primary/70"
            >
              {specialDay === "birthday"
                ? "♡"
                : specialDay === "our-day"
                  ? "♪"
                  : "✦"}
            </span>
          </button>

          <div className="min-w-0 flex-1 pt-1">
            <p className="text-[11px] font-semibold tracking-[0.15em] text-primary uppercase">
              {specialDayCopy?.label ?? "TODAY’S SONG"}
            </p>

            <p className="mt-1.5 text-[17px] font-medium leading-snug">
              {specialDayCopy
                ? selectedSong
                  ? specialDayCopy.selected
                  : specialDayCopy.empty
                : selectedSong
                  ? `今天和 ${idolName} 一起聽`
                  : `今天想和 ${idolName} 一起聽什麼？`}
            </p>

            {selectedSong ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => setPickerOpen(true)}
                className="mt-3 block w-full text-left disabled:opacity-50"
              >
                <span className="block truncate font-display text-[18px] leading-tight">
                  ♪ {selectedSong.title}
                </span>
                {selectedSong.artist ? (
                  <span className="mt-1 block truncate text-[11px] tracking-[0.04em] text-muted-foreground">
                    {selectedSong.artist}
                  </span>
                ) : null}
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                  換一首歌
                  <ArrowRight className="size-3" strokeWidth={1.6} />
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() => setPickerOpen(true)}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.07] px-4 py-2 text-xs font-medium text-primary transition-transform duration-300 active:scale-95 disabled:opacity-50"
              >
                <span aria-hidden="true">＋</span>
                選一首歌
              </button>
            )}
          </div>
        </div>

        {selectedSong ? (
          <div className="mt-4">
            <div className="flex items-center gap-2" aria-hidden="true">
              <span className="h-px flex-1 bg-border/70" />
              <span className="text-[9px] tracking-[0.18em] text-muted-foreground">
                今天和他一起聽
              </span>
              <span className="h-px flex-1 bg-border/70" />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] tracking-[0.06em] text-muted-foreground">
                  今天的心情
                </p>
                {entry?.mood ? (
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    今天是 {entry.mood} 的心情
                  </p>
                ) : null}
              </div>

              {streamingLink(selectedSong) ? (
                <a
                  href={streamingLink(selectedSong)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface/70 px-3 py-1.5 text-[10px] font-medium text-primary transition-transform duration-300 active:scale-95"
                >
                  <span aria-hidden="true">♪</span>
                  去聽這首
                </a>
              ) : null}
            </div>

            <div className="mt-3 flex items-center justify-between px-1">
              {SONG_MOOD_OPTIONS.map((mood, index) => {
                const active = entry?.mood === mood;

                return (
                  <button
                    key={mood}
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      void update({
                        songId: selectedSongId,
                        mood,
                      })
                    }
                    aria-label={`今天的心情：${mood}`}
                    aria-pressed={active}
                    className={`music-mood-sticker relative flex size-10 items-center justify-center rounded-[42%] text-[18px] transition-all duration-300 active:scale-90 disabled:opacity-50 ${
                      active
                        ? "music-mood-sticker--active bg-primary/15 ring-1 ring-primary/35"
                        : "bg-surface/55"
                    }`}
                    style={{
                      transform: active
                        ? "rotate(0deg) scale(1.08)"
                        : `rotate(${[-3, 2, -1, 3, -2][index] ?? 0}deg)`,
                    }}
                  >
                    {mood}
                    {active ? (
                      <span
                        aria-hidden="true"
                        className="music-mood-heart absolute -right-1 -top-2 text-[10px] text-primary"
                      >
                        ♡
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-[1.35rem] bg-primary/[0.055] px-4 py-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold tracking-[0.08em] text-primary">
                  已經留下 {musicDays} 個音樂日子 ♡
                </p>
                <p className="mt-1 truncate text-[14px] text-muted-foreground">
                  {specialDayCopy?.companion ??
                    `和 ${idolName} 留下的音樂日子`}
                </p>
              </div>

              <Link
                to="/music"
                className="inline-flex shrink-0 items-center gap-1 text-[14px] font-semibold text-primary"
              >
                音樂日記
                <ArrowRight className="size-3" strokeWidth={1.6} />
              </Link>
            </div>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-3 text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[78vh] max-w-md overflow-y-auto rounded-t-[2rem] border-border/70 bg-background px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="font-display text-[22px]">
              今天想聽哪一首？ ♡
            </SheetTitle>

            <SheetDescription>
              從我們的歌裡選一首，或把新的歌收藏進來。
            </SheetDescription>
          </SheetHeader>

          {songs.length > 0 ? (
            <div className="mt-5 space-y-2">
              {songs.map((song) => {
                const active = song.id === selectedSongId;

                return (
                  <button
                    key={song.id}
                    type="button"
                    disabled={saving}
                    onClick={() => void chooseSong(song.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-transform active:scale-[0.99] ${
                      active
                        ? "border-primary/50 bg-primary/10"
                        : "border-border/70 bg-card/80"
                    }`}
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      ♪
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {song.title}
                      </span>

                      {song.artist ? (
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {song.artist}
                        </span>
                      ) : null}
                    </span>

                    {active ? (
                      <span className="shrink-0 text-xs font-medium text-primary">
                        今天 ♡
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-surface/60 px-4 py-5 text-center">
              <TodaySongIcon className="mx-auto size-7 text-primary" />
              <p className="mt-2 text-sm font-medium">
                我們的歌還是空的 ♡
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                把第一首想一起聽的歌收藏進來。
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setPickerOpen(false);
              setAddOpen(true);
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
          >
            <Plus className="size-4" strokeWidth={2} />
            新增歌曲
          </button>
        </SheetContent>
      </Sheet>

      <IdolSongFormSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={createAndChooseSong}
      />
    </section>
  );
}

function Hero({
  idol,
  canSwitch,
  onSwitch,
}: {
  idol: Idol;
  canSwitch: boolean;
  onSwitch: () => void;
}) {
  const backdrop = idol.photo || idol.cutoutPhoto;
  return (
    <section className="relative mt-0 overflow-hidden rounded-[1.7rem] bg-gradient-to-b from-accent/80 via-surface to-card shadow-soft">
      {backdrop ? (
        <StoredImage
          src={backdrop}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full scale-110 object-cover opacity-20 blur-3xl"
        />
      ) : null}
      <div className="absolute -left-16 top-12 size-56 rounded-full bg-white/40 blur-3xl" />
      <div className="absolute -right-20 bottom-12 size-60 rounded-full bg-primary/20 blur-3xl" />
      <span className="absolute left-5 top-24 text-xl text-primary/30">✧</span>
      <span className="absolute right-6 top-36 text-2xl text-primary/30">✦</span>
      <span className="absolute left-9 bottom-28 text-lg text-primary/35">♡</span>
      {canSwitch ? (
        <button
          type="button"
          onClick={onSwitch}
          aria-label="切換首頁封面偶像"
          className="absolute right-4 top-4 z-40 flex size-10 items-center justify-center rounded-full border border-white/70 bg-black/30 text-white shadow-lg backdrop-blur-md transition-transform active:scale-90"
        >
          <Repeat2 className="size-5" strokeWidth={1.8} />
        </button>
      ) : null}
      <Link
        to="/idols/$idolId"
        params={{ idolId: idol.id }}
        className="relative block h-[300px] overflow-hidden"
      >
        {idol.cutoutPhoto ? (
          <StoredImage
            src={idol.cutoutPhoto}
            alt={`${idol.name} 的去背照片`}
            className="absolute inset-x-0 bottom-0 z-10 mx-auto h-[94%] w-full object-contain object-bottom"
          />
        ) : idol.photo ? (
          <StoredImage
            src={idol.photo}
            alt={`${idol.name} 的照片`}
            className="absolute inset-0 z-10 size-full object-cover object-[72%_center]"
          />
        ) : (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="size-8" strokeWidth={1.3} />
            <span className="text-sm">放一張你喜歡的照片 ♡</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 z-20 h-48 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
        <div className="absolute bottom-5 left-5 z-30">
          <p className="font-display text-[28px] leading-tight text-accent drop-shadow-md">
            {timeGreeting()}
          </p>
          <p className="mt-2 text-[16px] leading-relaxed text-white drop-shadow-md">
            {dailyAnimalLine(idol)}
          </p>
        </div>
      </Link>
    </section>
  );
}

function HomePage() {
  const { idols, homeIdol, ready, coverRotation, setMainIdol, setCoverRotation } = useIdolSource();
  const { events } = useEventSource();
  const { items: archaeology } = useArchaeologySource();
  const { all: memories } = useMemorySource();
  const main = homeIdol;
  const { songs, addSong } = useIdolMusicSource(main?.id);
  const todayJournal = useTodaySongJournal(main?.id);
  const songHistory = useSongJournalHistory(main?.id);

  const musicDays = useMemo(() => {
    const dates = new Set(
      songHistory.entries
        .filter((entry) => Boolean(entry.songId))
        .map((entry) => entry.entryDate),
    );

    if (
      todayJournal.entry?.songId &&
      todayJournal.entry.entryDate
    ) {
      dates.add(todayJournal.entry.entryDate);
    }

    return dates.size;
  }, [songHistory.entries, todayJournal.entry]);

  const randomSongMemories = useMemo(() => {
    return songHistory.entries.flatMap((entry) => {
      if (!entry.songId) return [];

      const song = songs.find((item) => item.id === entry.songId);
      if (!song) return [];

      return [
        {
          id: entry.id,
          journalEntryId: entry.id,
          idolId: entry.idolId,
          songId: song.id,
          title: song.title,
          artist: song.artist,
          date: entry.entryDate,
          mood: entry.mood,
          appleMusicUrl: song.appleMusicUrl,
          spotifyUrl: song.spotifyUrl,
        },
      ];
    });
  }, [songHistory.entries, songs]);

  const companionship = useMemo(() => (main ? daysSince(main.sinceDate) : null), [main]);

  const todaySongSpecialDay = useMemo<TodaySongSpecialDay>(() => {
    if (!main) return null;

    if (nextAnniversary(main.birthday)?.daysUntil === 0) {
      return "birthday";
    }

    if (nextAnniversary(main.debutDate)?.daysUntil === 0) {
      return "debut";
    }

    if (nextAnniversary(main.sinceDate)?.daysUntil === 0) {
      return "our-day";
    }

    return null;
  }, [main]);

  const nextMainEvent = useMemo(
    () => (main ? nextEvent(events.filter((event) => event.idolId === main.id)) : undefined),
    [events, main],
  );
  const latestArchaeology = useMemo(() => {
    if (!main) return undefined;
    const linked = archaeology.filter((item) => item.idolId === main.id);
    const candidates = linked.length > 0 ? linked : archaeology.filter((item) => !item.idolId);
    return [...candidates].sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      if (Boolean(a.imageUrl) !== Boolean(b.imageUrl)) {
        return a.imageUrl ? -1 : 1;
      }
      return b.createdAt.localeCompare(a.createdAt);
    })[0];
  }, [archaeology, main]);
  const memoryFromToday = useMemo(() => {
    if (!main) return undefined;
    const today = new Date();
    const monthDay = `-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const currentYear = today.getFullYear();
    return memories
      .filter((memory) => {
        const year = Number(memory.date.slice(0, 4));
        return memory.idolId === main.id && memory.date.endsWith(monthDay) && year < currentYear;
      })
      .sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [main, memories]);

  return (
    <AppShell showProfileShortcut={false}>
      <header className="-mt-4 mb-2 flex items-center justify-between px-1">
        <p className="font-display text-[27px] tracking-[-0.03em] text-primary">IdolDays</p>
        <Link
          to="/profile"
          aria-label="通知與個人設定"
          className="relative flex size-10 items-center justify-center rounded-full border border-border/75 bg-card/85 text-card-foreground shadow-soft backdrop-blur-md transition-transform active:scale-95"
        >
          <Bell className="size-5" strokeWidth={1.55} />
          <span className="absolute right-0.5 top-0.5 size-2.5 rounded-full border-2 border-card bg-primary" />
        </Link>
      </header>

      {!ready ? (
        <div className="h-[31rem] rounded-[2rem] bg-surface/60" aria-hidden />
      ) : main ? (
        <>
          <Hero
            idol={main}
            canSwitch={idols.length > 1}
            onSwitch={() => {
              const currentIndex = Math.max(
                0,
                idols.findIndex((idol) => idol.id === main.id),
              );
              const next = idols[(currentIndex + 1) % idols.length];
              if (next) {
                setCoverRotation(false);
                void setMainIdol(next.id);
              }
            }}
          />
          {coverRotation && idols.length > 1 ? (
            <p className="mt-2 px-2 text-right text-[11px] text-muted-foreground">
              ✦ 今天由 {main.name} 陪你
            </p>
          ) : null}
          {companionship && !companionship.isFuture && companionship.days !== null ? (
            <Link
              to="/idols/$idolId"
              params={{ idolId: main.id }}
              className="mt-3 flex min-h-[56px] items-center justify-between rounded-[1.35rem] border border-border/60 bg-card/75 px-4 py-2.5 shadow-soft backdrop-blur-xl transition-transform active:scale-[0.99]"
            >
              <div>
                <p className="text-[13px] font-semibold tracking-[0.08em] text-primary">
                  一起走過 ♡
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">和 {main.name}</p>
              </div>

              <p className="font-display text-[27px] leading-none text-foreground">
                {companionship.days}
                <span className="ml-1 text-sm text-muted-foreground">天</span>
              </p>
            </Link>
          ) : null}

          <Link
            to="/memories"
            className="mt-6 block rounded-[1.8rem] bg-gradient-to-br from-primary/[0.11] via-card/80 to-accent/45 px-5 py-4 shadow-soft transition-transform active:scale-[0.99]"
          >
            <p className="text-[14px] font-semibold tracking-[0.06em] text-primary">今天和他 ♡</p>
            <h2 className="mt-1.5 font-display text-[21px] font-medium leading-snug tracking-[-0.02em] text-foreground">
              今天，想留下什麼？
            </h2>
            <p className="mt-1.5 text-[15px] text-muted-foreground">和 {main.name} 的今天</p>
            <div className="mt-3 flex items-center gap-2 text-[14px] font-medium text-primary">
              <span>♪ 一首歌</span>
              <span aria-hidden="true">·</span>
              <span>♡ 一句話</span>
              <span aria-hidden="true">·</span>
              <span>▣ 一張照片</span>
              <ArrowRight className="ml-auto size-4" strokeWidth={1.8} />
            </div>
          </Link>

          {nextMainEvent && eventCountdown(nextMainEvent.date)?.status === "TODAY" ? (
            <TodayEventMomentCard event={nextMainEvent} />
          ) : null}
          {nextMainEvent ? <EventCard event={nextMainEvent} /> : null}
          {nextMainEvent && canUseFanWeather(nextMainEvent) ? (
            <FanWeatherCard event={nextMainEvent} />
          ) : null}
          <TodaySongCard
            idolName={main.name || "他"}
            idolPhoto={main.photo}
            idolCutoutPhoto={main.cutoutPhoto}
            songs={songs}
            entry={todayJournal.entry}
            musicDays={musicDays}
            specialDay={todaySongSpecialDay}
            save={todayJournal.save}
            addSong={addSong}
          />

          {memoryFromToday ? (
            <MemoryCard
              memory={memoryFromToday}
              song={songs.find((song) => song.id === memoryFromToday.songId)}
            />
          ) : null}

          {latestArchaeology ? <ArchaeologyCard item={latestArchaeology} /> : null}

          <div className="mt-3">
            <RandomSongMemoryCard items={randomSongMemories} ready={songHistory.ready} />
          </div>

          <p className="mt-6 px-8 pb-2 text-center font-display text-[15px] leading-relaxed text-muted-foreground/75">
            一起走過的每一天，
            <br />
            都是珍貴的回憶 ♡
          </p>
        </>
      ) : (
        <Section title="我的本命 ♡">
          <EmptyState
            icon={<Heart className="size-5" strokeWidth={1.6} />}
            title="先加入你的本命 ♡"
            description="名字＋一張照片，就可以開始。"
            action={
              <Link
                to="/idols"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
              >
                <Plus className="size-4" strokeWidth={2} />
                ＋ 加入本命
              </Link>
            }
          />
        </Section>
      )}
    </AppShell>
  );
}
