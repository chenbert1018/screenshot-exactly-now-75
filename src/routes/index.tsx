import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ImageIcon, Plus } from "lucide-react";
import { AppShell, Section, EmptyState, SoftCard } from "@/components/AppShell";
import { useIdols, type Idol } from "@/lib/idols";
import { daysSince, nextAnniversary, primaryDay, parseLocalDate } from "@/lib/dates";
import {
  dailyMessage,
  formatDotDate,
  todayFullLabel,
  todayWeekday,
} from "@/lib/companion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IdolDays｜偶像專屬倒數日" },
      {
        name: "description",
        content: "IdolDays 是為 KPOP 粉絲打造的私人陪伴 App，收藏你喜歡一個人的日子。",
      },
      { property: "og:title", content: "IdolDays｜偶像專屬倒數日" },
      {
        property: "og:description",
        content: "不是在倒數日子，而是在收藏我喜歡一個人的日子。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function Divider() {
  return <div className="mx-auto my-9 h-px w-16 bg-border/70" />;
}

function CountdownHero({ idol }: { idol: Idol }) {
  const day = primaryDay(idol);
  const source = day?.kind === "birthday" ? idol.birthday : idol.debutDate;
  const anniversary = nextAnniversary(source);
  const isToday = day?.daysUntil === 0;

  return (
    <section className="text-center">
      <Link
        to="/idols/$idolId"
        params={{ idolId: idol.id }}
        className="mx-auto block size-40 overflow-hidden rounded-full border border-border/60 bg-surface shadow-soft transition-transform duration-300 active:scale-[0.98]"
      >
        {idol.photo ? (
          <img src={idol.photo} alt={`${idol.name} 的照片`} className="size-full object-cover" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
            <ImageIcon className="size-6" strokeWidth={1.3} />
            <span className="text-[11px]">放一張照片</span>
          </div>
        )}
      </Link>

      {day && anniversary ? (
        <>
          <p className="mt-8 text-[11px] tracking-[0.34em] text-muted-foreground uppercase">
            Next D-Day
          </p>

          {isToday ? (
            <p className="mt-3 font-serif text-[64px] leading-none font-semibold text-primary">
              TODAY
            </p>
          ) : (
            <>
              <p className="mt-2 font-serif text-[92px] leading-[0.95] font-semibold text-primary">
                {day.daysUntil}
              </p>
              <p className="mt-2 text-[11px] tracking-[0.34em] text-muted-foreground uppercase">
                Days
              </p>
            </>
          )}

          <p className="mt-6 text-[17px]">
            {day.kind === "birthday" ? "🎂" : "✨"} {idol.name} 的{day.title}
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {formatDotDate(anniversary.nextDate)}・{day.ddayLabel}
          </p>
          {isToday ? (
            <p className="mt-3 text-[15px] text-primary">今天就是值得期待的日子。</p>
          ) : null}
        </>
      ) : (
        <>
          <h2 className="mt-7 text-xl font-semibold">
            {idol.groupName ? `${idol.groupName}・${idol.name}` : idol.name}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">還沒有設定重要日子</p>
          <Link
            to="/idols/$idolId"
            params={{ idolId: idol.id }}
            className="mt-4 inline-flex rounded-full border border-border/70 px-5 py-2 text-xs transition-transform duration-300 active:scale-95"
          >
            去設定
          </Link>
        </>
      )}
    </section>
  );
}

function Companionship({ idol }: { idol: Idol }) {
  const since = daysSince(idol.sinceDate);
  const start = parseLocalDate(idol.sinceDate);

  if (!since || since.isFuture || since.days === null) {
    return (
      <section className="text-center">
        <p className="text-sm text-muted-foreground">還沒開始計算陪伴的日子</p>
        <Link
          to="/idols/$idolId"
          params={{ idolId: idol.id }}
          className="mt-3 inline-flex rounded-full border border-border/70 px-5 py-2 text-xs transition-transform duration-300 active:scale-95"
        >
          設定喜歡他的日期
        </Link>
      </section>
    );
  }

  return (
    <section className="text-center">
      <p className="text-sm text-muted-foreground">已經一起走過</p>
      <p className="mt-2 font-serif text-[40px] leading-none font-semibold">
        {since.days}
        <span className="ml-2 align-middle text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
          Days
        </span>
      </p>
      {start ? (
        <p className="mt-2.5 text-xs tracking-wide text-muted-foreground">
          since {start.y}.{String(start.m).padStart(2, "0")}.{String(start.d).padStart(2, "0")}
        </p>
      ) : null}
    </section>
  );
}

function TodaySection() {
  return (
    <section className="text-center">
      <p className="text-[11px] tracking-[0.34em] text-muted-foreground uppercase">Today</p>
      <p className="mt-3 text-[17px]">{todayFullLabel()}</p>
      <p className="mt-1 text-sm text-muted-foreground">{todayWeekday()}</p>
      <p className="mt-5 text-[15px] leading-relaxed">{dailyMessage()}</p>
    </section>
  );
}

function KeepToday({ idol }: { idol?: Idol }) {
  const [kept, setKept] = useState(false);
  const since = idol ? daysSince(idol.sinceDate) : null;
  const text =
    idol && since && !since.isFuture
      ? `你和 ${idol.name} 已經一起走過 ${since.days} 天。`
      : "今天也留給自己一點喜歡的時間。";

  return (
    <SoftCard className="px-6 py-7 text-center">
      <p className="text-xs tracking-wide text-muted-foreground">今天值得收藏</p>
      <p className="mt-3 text-[15px] leading-relaxed">{text}</p>
      {kept ? (
        <p className="mt-5 text-sm text-primary">已把今天留在心裡 ♡</p>
      ) : (
        <button
          type="button"
          onClick={() => setKept(true)}
          className="mt-5 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
        >
          收藏今天
        </button>
      )}
    </SoftCard>
  );
}

function YearsAgo() {
  return (
    <section className="text-center">
      <p className="text-xs tracking-wide text-muted-foreground">幾年前的今天</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        這一天還沒有留下回憶。
      </p>
    </section>
  );
}

function HomePage() {
  const { idols, ready } = useIdols();
  const main = idols[0];
  const others = idols.slice(1);

  return (
    <AppShell>
      <header className="mb-8 text-center">
        <p className="text-xs tracking-[0.32em] text-muted-foreground uppercase">IdolDays</p>
        <p className="mt-2 text-xs tracking-[0.2em] text-muted-foreground">{formatDotDate(new Date())}</p>
      </header>

      {!ready ? (
        <div className="h-72 rounded-3xl border border-border/60 bg-surface/40" aria-hidden />
      ) : main ? (
        <>
          <CountdownHero idol={main} />
          <Divider />
          <Companionship idol={main} />
          <Divider />
          <TodaySection />
          <div className="mt-9">
            <KeepToday idol={main} />
          </div>
          <Divider />
          <YearsAgo />

          {others.length > 0 ? (
            <div className="mt-10">
              <h2 className="mb-3 text-[15px] font-medium tracking-wide">我的偶像</h2>
              <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2">
                {others.map((idol) => (
                  <div key={idol.id} className="w-36 shrink-0 snap-start">
                    <MiniIdol idol={idol} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <Section title="我的偶像">
            <EmptyState
              icon={<Heart className="size-5" strokeWidth={1.6} />}
              title="還沒有你的第一位偶像"
              description="今天也可以從一個名字開始，收藏屬於你的追星日子。"
              action={
                <Link
                  to="/idols"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
                >
                  <Plus className="size-4" strokeWidth={2} />
                  加入第一位偶像
                </Link>
              }
            />
          </Section>

          <Divider />
          <TodaySection />
          <div className="mt-9">
            <KeepToday />
          </div>
          <Divider />
          <YearsAgo />
        </>
      )}
    </AppShell>
  );
}

function MiniIdol({ idol }: { idol: Idol }) {
  const day = primaryDay(idol);
  return (
    <Link
      to="/idols/$idolId"
      params={{ idolId: idol.id }}
      className="block overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition-transform duration-300 active:scale-[0.98]"
    >
      <div className="aspect-[3/4] w-full bg-surface">
        {idol.photo ? (
          <img
            src={idol.photo}
            alt={`${idol.name} 的照片`}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageIcon className="size-5" strokeWidth={1.4} />
          </div>
        )}
      </div>
      <div className="px-3 pt-2.5 pb-3">
        <p className="truncate text-sm font-medium">{idol.name}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {day ? day.ddayLabel : "設定重要日子"}
        </p>
      </div>
    </Link>
  );
}
