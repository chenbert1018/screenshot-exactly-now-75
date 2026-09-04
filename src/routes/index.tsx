import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ImageIcon, Plus } from "lucide-react";
import { AppShell, Section, EmptyState, SoftCard } from "@/components/AppShell";
import { useIdols, type Idol } from "@/lib/idols";
import { daysSince, primaryDay } from "@/lib/dates";
import { dailyMessage, dailyReminder, todayHighlight, todayLabel } from "@/lib/companion";

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
    ],
  }),
  component: HomePage,
});

function MainIdol({ idol }: { idol: Idol }) {
  const day = primaryDay(idol);
  const since = daysSince(idol.sinceDate);

  return (
    <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft">
      <Link
        to="/idols/$idolId"
        params={{ idolId: idol.id }}
        className="block transition-transform duration-300 active:scale-[0.99]"
      >
        <div className="aspect-[4/5] w-full bg-surface">
          {idol.photo ? (
            <img src={idol.photo} alt={`${idol.name} 的照片`} className="size-full object-cover" />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageIcon className="size-7" strokeWidth={1.3} />
              <span className="text-xs">放一張你最喜歡的照片</span>
            </div>
          )}
        </div>

        <div className="px-6 pt-7 text-center">
          <h2 className="text-xl font-semibold">
            {idol.groupName ? `${idol.groupName}・${idol.name}` : idol.name}
          </h2>

          {day ? (
            <>
              <p className="mt-5 text-[42px] leading-none font-semibold text-primary">
                {day.ddayLabel}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{day.humanLabel}</p>
            </>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">還沒有設定重要日子</p>
          )}

          <p className="mt-5 text-[15px]">{since ? since.humanLabel : "設定喜歡他的日期"}</p>
          {since && !since.isFuture ? (
            <p className="mt-1 text-sm text-muted-foreground">今天陪你第 {since.days} 天</p>
          ) : null}
        </div>
      </Link>

      <div className="mx-6 mt-6 mb-6 border-t border-border/60 pt-4 text-center">
        <p className="text-xs text-muted-foreground">下一個重要日子</p>
        {day ? (
          <>
            <p className="mt-1.5 text-sm">{`${day.title}・${day.dateLabel}`}</p>
            <p className="mt-1 text-xs text-muted-foreground">{day.humanLabel}</p>
          </>
        ) : (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">還沒有設定重要日子</p>
            <Link
              to="/idols/$idolId"
              params={{ idolId: idol.id }}
              className="mt-3 inline-flex rounded-full border border-border/70 px-4 py-1.5 text-xs transition-transform duration-300 active:scale-95"
            >
              去設定
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function HomePage() {
  const { idols, ready } = useIdols();
  const main = idols[0];
  const others = idols.slice(1);

  return (
    <AppShell>
      <header className="mb-7">
        <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">IdolDays</p>
        <h1 className="mt-3 text-[28px] leading-snug font-semibold">今天</h1>
        <p className="mt-2 text-sm text-muted-foreground">{todayLabel()}</p>
        <p className="mt-3 text-[15px] leading-relaxed">{dailyMessage()}</p>
      </header>

      {!ready ? (
        <div className="h-64 rounded-3xl border border-border/60 bg-surface/40" aria-hidden />
      ) : main ? (
        <>
          <MainIdol idol={main} />

          <SoftCard className="mt-5 px-5 py-5">
            <p className="text-xs text-muted-foreground">今天的小提醒</p>
            <p className="mt-2 text-[15px] leading-relaxed">{dailyReminder(main)}</p>
          </SoftCard>

          <SoftCard className="mt-4 px-5 py-5">
            <p className="text-xs text-muted-foreground">今天值得收藏</p>
            <p className="mt-2 text-[15px] leading-relaxed">{todayHighlight(main)}</p>
          </SoftCard>

          <SoftCard className="mt-4 px-5 py-5">
            <p className="text-xs text-muted-foreground">幾年前的今天</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              未來，這裡會出現你收藏過的那一天。
            </p>
          </SoftCard>

          {others.length > 0 ? (
            <div className="mt-8">
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

          <SoftCard className="mt-4 px-5 py-5">
            <p className="text-xs text-muted-foreground">幾年前的今天</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              未來，這裡會出現你收藏過的那一天。
            </p>
          </SoftCard>
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
