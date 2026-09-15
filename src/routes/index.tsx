import { StoredImage } from "@/components/StoredImage";
import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bell, CalendarHeart, CloudSun, Heart, History, ImageIcon, Plus, Repeat2, Search } from "lucide-react";
import { AppShell, EmptyState, Section } from "@/components/AppShell";
import type { Idol } from "@/lib/idols";
import { useIdolSource } from "@/lib/idols.source";
import { canUseFanWeather, eventCountdown, nextEvent, type IdolEvent } from "@/lib/events";
import { useEventSource } from "@/lib/events.source";
import { useArchaeology } from "@/lib/archaeology";
import { useMemorySource } from "@/lib/memories.source";
import { daysSince } from "@/lib/dates";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IdolDays｜偶像專屬倒數日" },
      { name: "description", content: "IdolDays 是為 KPOP 粉絲打造的私人陪伴 App，收藏你喜歡一個人的日子。" },
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
  DOG: ["今天也要元氣滿滿地出發！", "走吧，今天也一起發光。"],
  CAT: ["不准忘記照顧自己，追星也要帥帥的。", "行程帶好，其他交給期待就好。"],
  FOX: ["行程確認好，漂亮地去見喜歡的人吧。", "票券、手燈、心意，全部準備得剛剛好。"],
  RABBIT: ["慢慢準備也沒關係，今天會是可愛的一天。", "帶著好心情，溫柔地去見喜歡的人吧。"],
  WOLF: ["帶好裝備，安靜地把期待做到最好。", "今天也穩穩地，奔向你想見的人。"],
  LION: ["跟著我，今天也要自信地奔向喜歡。", "抬頭出發，你的喜歡值得全力以赴。"],
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
  const days = eventCountdown(event.date).daysUntil ?? 0;
  return days === 0 ? "TODAY" : `D - ${Math.max(0, days)}`;
}

function EventCard({ event }: { event: IdolEvent }) {
  return (
    <Link to="/events" className="mt-3 flex items-center gap-4 rounded-[1.8rem] border border-border/70 bg-card/90 text-card-foreground px-5 py-4 shadow-[0_12px_32px_rgba(157,91,116,0.12)] backdrop-blur-xl transition-transform active:scale-[0.99]">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <CalendarHeart className="size-6" strokeWidth={1.55} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium tracking-[0.12em] text-primary uppercase">Next D-Day</p>
        <p className="mt-1 truncate text-[17px] font-medium">{event.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{dotDate(event.date)}</p>
      </div>
      <p className="shrink-0 font-display text-[35px] leading-none text-primary">{dayLabel(event)}</p>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <ArrowRight className="size-4" strokeWidth={2} />
      </span>
    </Link>
  );
}

function FanWeatherCard({ event }: { event: IdolEvent }) {
  const days = eventCountdown(event.date).daysUntil ?? 0;
  const timing = days === 0 ? "今天" : `${Math.max(0, days)} 天後`;
  const place = event.locationName?.trim() || event.city?.trim() || event.title;

  return (
    <Link to="/weather/$eventId" params={{ eventId: event.id }} className="mt-3 flex items-center gap-4 rounded-[1.8rem] border border-border/70 bg-card/90 text-card-foreground px-5 py-4 shadow-[0_12px_32px_rgba(157,91,116,0.12)] backdrop-blur-xl transition-transform active:scale-[0.99]">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8e6ff] text-[#8b87cf]">
        <CloudSun className="size-7" strokeWidth={1.45} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium tracking-[0.08em] text-primary">Fan Weather</p>
        <p className="mt-1 truncate text-[16px] font-medium">{timing}・{event.title}</p>
        <p className="mt-1 truncate text-sm text-muted-foreground">記得留意 {place} 的天氣 ♡</p>
      </div>
      <ArrowRight className="size-5 shrink-0 text-primary" strokeWidth={1.8} />
    </Link>
  );
}


function FanWeatherSetupCard({ event }: { event: IdolEvent }) {
  const days = eventCountdown(event.date).daysUntil ?? 0;
  const timing = days === 0 ? "今天" : `${Math.max(0, days)} 天後`;

  return (
    <Link to="/events" className="mt-3 flex items-center gap-4 rounded-[1.8rem] border border-border/70 bg-card/85 text-card-foreground px-5 py-4 shadow-[0_12px_32px_rgba(157,91,116,0.12)] backdrop-blur-xl transition-transform active:scale-[0.99]">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8e6ff] text-[#8b87cf]">
        <CloudSun className="size-7" strokeWidth={1.45} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium tracking-[0.08em] text-primary">Fan Weather</p>
        <p className="mt-1 truncate text-[16px] font-medium">{timing}・{event.title}</p>
        <p className="mt-1 truncate text-sm text-muted-foreground">設定地點與城市，幫你準備追星天氣 ♡</p>
      </div>
      <ArrowRight className="size-5 shrink-0 text-primary" strokeWidth={1.8} />
    </Link>
  );
}

function ArchaeologyCard({ item }: { item: { title: string; imageUrl?: string; createdAt: string; collection: string } }) {
  return (
    <Link to="/archaeology" className="mt-3 flex items-center gap-4 rounded-[1.8rem] border border-border/70 bg-card/90 text-card-foreground p-3 shadow-[0_12px_32px_rgba(157,91,116,0.12)] backdrop-blur-xl transition-transform active:scale-[0.99]">
      <div className="flex size-[5.2rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary">
        {item.imageUrl ? <StoredImage src={item.imageUrl} alt="" className="size-full object-cover" /> : <Search className="size-7" strokeWidth={1.5} />}
      </div>
      <div className="min-w-0 flex-1 py-1">
        <p className="text-[11px] font-medium text-primary">▣ 最近收進考古</p>
        <p className="mt-1 truncate text-[17px] font-medium">{item.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{dotDate(item.createdAt.slice(0, 10))}{item.collection ? `・${item.collection}` : ""}</p>
      </div>
      <ArrowRight className="mr-1 size-5 shrink-0 text-primary" strokeWidth={1.8} />
    </Link>
  );
}


function EmptyArchaeologyCard() {
  return (
    <Link to="/archaeology" className="mt-3 flex items-center gap-4 rounded-[1.8rem] border border-border/70 bg-card/85 text-card-foreground p-3 shadow-[0_12px_32px_rgba(157,91,116,0.12)] backdrop-blur-xl transition-transform active:scale-[0.99]">
      <div className="flex size-[5.2rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary">
        <Search className="size-7" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1 py-1">
        <p className="text-[11px] font-medium text-primary">▣ 最近收進考古</p>
        <p className="mt-1 text-[16px] font-medium">還沒有收進考古</p>
        <p className="mt-1 truncate text-sm text-muted-foreground">把第一筆珍貴片段收藏起來吧 ♡</p>
      </div>
      <ArrowRight className="mr-1 size-5 shrink-0 text-primary" strokeWidth={1.8} />
    </Link>
  );
}

function MemoryCard({ memory }: { memory: { title: string; note: string; photo?: string; date: string } }) {
  const text = memory.title.trim() || memory.note.trim() || "那天也好想你 ♡";
  return (
    <Link to="/memories" className="mt-3 flex items-center gap-4 rounded-[1.8rem] border border-border/70 bg-card/90 text-card-foreground p-3 shadow-[0_12px_32px_rgba(157,91,116,0.12)] backdrop-blur-xl transition-transform active:scale-[0.99]">
      <div className="flex size-[5.2rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary">
        {memory.photo ? <StoredImage src={memory.photo} alt="" className="size-full object-cover" /> : <History className="size-7" strokeWidth={1.45} />}
      </div>
      <div className="min-w-0 flex-1 py-1">
        <p className="text-[11px] font-medium text-primary">▣ 去年的今天</p>
        <p className="mt-1 text-[17px] font-medium">{dotDate(memory.date)}</p>
        <p className="mt-1 truncate text-sm text-muted-foreground">{text}</p>
      </div>
      <ArrowRight className="mr-1 size-5 shrink-0 text-primary" strokeWidth={1.8} />
    </Link>
  );
}

function EmptyMemoryCard() {
  return (
    <Link to="/memories" className="mt-3 flex items-center gap-4 rounded-[1.8rem] border border-border/70 bg-card/85 text-card-foreground px-5 py-4 shadow-soft backdrop-blur-xl transition-transform active:scale-[0.99]">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><History className="size-6" strokeWidth={1.45} /></div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-primary">去年的今天</p>
        <p className="mt-1 text-sm text-muted-foreground">今天還沒有去年的回憶，繼續把喜歡收藏起來吧 ♡</p>
      </div>
      <ArrowRight className="size-5 shrink-0 text-primary" strokeWidth={1.8} />
    </Link>
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
    <section className="relative mt-1 overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#f6cddb] via-[#f9dfe7] to-[#fdf0f3] shadow-[0_18px_40px_rgba(176,102,130,0.16)]">
      {backdrop ? <StoredImage src={backdrop} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover opacity-20 blur-3xl" /> : null}
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
      <Link to="/idols/$idolId" params={{ idolId: idol.id }} className="relative block h-[350px] overflow-hidden">
        {idol.cutoutPhoto ? (
          <StoredImage src={idol.cutoutPhoto} alt={`${idol.name} 的去背照片`} className="absolute inset-x-0 bottom-0 z-10 mx-auto h-[94%] w-full object-contain object-bottom" />
        ) : idol.photo ? (
          <StoredImage src={idol.photo} alt={`${idol.name} 的照片`} className="absolute inset-0 z-10 size-full object-cover object-[72%_center]" />
        ) : (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-muted-foreground"><ImageIcon className="size-8" strokeWidth={1.3} /><span className="text-sm">放一張你喜歡的照片 ♡</span></div>
        )}
        <div className="absolute inset-x-0 bottom-0 z-20 h-48 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
        <div className="absolute bottom-5 left-5 z-30">
          <p className="font-display text-[28px] leading-tight text-[#ffafc9] drop-shadow-[0_2px_5px_rgba(0,0,0,0.55)]">{timeGreeting()}</p>
          <p className="mt-2 text-[16px] leading-relaxed text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.7)]">{dailyAnimalLine(idol)}</p>
        </div>
      </Link>
    </section>
  );
}

function HomePage() {
  const {
    idols,
    homeIdol,
    ready,
    coverRotation,
    setMainIdol,
    setCoverRotation,
  } = useIdolSource();
  const { events } = useEventSource();
  const { items: archaeology } = useArchaeology();
  const { all: memories } = useMemorySource();
  const main = homeIdol;
  const companionship = useMemo(
    () => (main ? daysSince(main.sinceDate) : null),
    [main],
  );

  const nextMainEvent = useMemo(
    () => (main ? nextEvent(events.filter((event) => event.idolId === main.id)) : undefined),
    [events, main],
  );
  const latestArchaeology = useMemo(
    () => main ? archaeology.filter((item) => item.idolId === main.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] : undefined,
    [archaeology, main],
  );
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
      <header className="mb-3 flex items-center justify-between px-1">
        <p className="font-display text-[27px] tracking-[-0.03em] text-primary">IdolDays</p>
        <Link to="/profile" aria-label="通知與個人設定" className="relative flex size-10 items-center justify-center rounded-full border border-white/75 bg-white/70 text-foreground shadow-soft backdrop-blur-md transition-transform active:scale-95">
          <Bell className="size-5" strokeWidth={1.55} />
          <span className="absolute right-0.5 top-0.5 size-2.5 rounded-full border-2 border-white bg-primary" />
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
              const currentIndex = Math.max(0, idols.findIndex((idol) => idol.id === main.id));
              const next = idols[(currentIndex + 1) % idols.length];
              if (next) {
                setCoverRotation(false);
                void setMainIdol(next.id);
              }
            }}
          />
          {coverRotation && idols.length > 1 ? (
            <p className="mt-2 px-2 text-right text-[11px] text-muted-foreground">每日輪換中・按右上角可立即指定另一位</p>
          ) : null}
          {nextMainEvent ? <EventCard event={nextMainEvent} /> : null}
          {nextMainEvent ? (
            canUseFanWeather(nextMainEvent) ? (
              <FanWeatherCard event={nextMainEvent} />
            ) : (
              <FanWeatherSetupCard event={nextMainEvent} />
            )
          ) : null}
          {latestArchaeology ? <ArchaeologyCard item={latestArchaeology} /> : <EmptyArchaeologyCard />}
          {memoryFromToday ? <MemoryCard memory={memoryFromToday} /> : <EmptyMemoryCard />}

          {companionship && !companionship.isFuture && companionship.days !== null ? (
            <section className="relative mt-5 rounded-[1.8rem] border border-border/70 bg-card/90 px-5 py-4 text-center text-card-foreground shadow-[0_12px_32px_rgba(157,91,116,0.10)] backdrop-blur-xl">
              <span aria-hidden className="absolute right-6 top-4 text-xl text-primary/55">♥</span>
              <p className="text-[13px] font-medium text-muted-foreground">陪伴總走過</p>
              <p className="mt-1 font-display text-[44px] leading-none text-foreground">
                {companionship.days}
                <span className="ml-1 text-[20px]">天</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">一起走過的每一天都很珍貴 ♡</p>
            </section>
          ) : null}

          <p className="mt-8 px-8 text-center font-display text-[16px] leading-relaxed text-muted-foreground/80">一起走過的每一天，<br />都是珍貴的回憶 ♡</p>
        </>
      ) : (
        <Section title="我的偶像">
          <EmptyState
            icon={<Heart className="size-5" strokeWidth={1.6} />}
            title="還沒有你的第一位偶像"
            description="今天也可以從一個名字開始，收藏屬於你的追星日子。"
            action={<Link to="/idols" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"><Plus className="size-4" strokeWidth={2} />加入第一位偶像</Link>}
          />
        </Section>
      )}
    </AppShell>
  );
}
