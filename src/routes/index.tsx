import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, CalendarHeart, Clock } from "lucide-react";
import { AppShell, Section, EmptyState, SoftCard } from "@/components/AppShell";

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

function todayLabel() {
  const now = new Date();
  const week = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"][now.getDay()];
  return `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 ${week}`;
}

function HomePage() {
  return (
    <AppShell>
      <header className="mb-9">
        <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">IdolDays</p>
        <h1 className="mt-3 text-[30px] leading-snug font-semibold">
          今天也是
          <br />
          喜歡他的日子
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{todayLabel()}</p>
      </header>

      <SoftCard className="mb-8 px-6 py-7">
        <p className="text-[15px] leading-loose text-surface-foreground">
          不是在倒數日子，
          <br />
          而是在收藏我喜歡一個人的日子。
        </p>
      </SoftCard>

      <Section title="我的偶像">
        <EmptyState
          icon={<Heart className="size-5" strokeWidth={1.6} />}
          title="還沒有加入你的第一位偶像"
          description="開始收藏屬於你的追星日子吧"
          action={
            <Link
              to="/idols"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
            >
              加入偶像
            </Link>
          }
        />
      </Section>

      <Section title="最近的日子">
        <EmptyState
          icon={<Clock className="size-5" strokeWidth={1.6} />}
          title="還沒有紀錄的日子"
          description="之後這裡會出現你們一起走過的時間"
        />
      </Section>

      <Section title="即將到來">
        <EmptyState
          icon={<CalendarHeart className="size-5" strokeWidth={1.6} />}
          title="目前沒有即將到來的日子"
          description="生日、出道日、演唱會，都會安靜地在這裡等你"
        />
      </Section>
    </AppShell>
  );
}
