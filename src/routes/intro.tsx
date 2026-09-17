import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarHeart,
  Heart,
  Images,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/intro")({
  head: () => ({
    meta: [
      { title: "IdolDays｜把喜歡的每一天留下來" },
      {
        name: "description",
        content: "專為 K-POP 粉絲打造的私人追星陪伴 App。",
      },
    ],
  }),
  component: IdolDaysIntro,
});

const moments = [
  {
    Icon: CalendarHeart,
    eyebrow: "COUNT THE DAYS",
    title: "期待見面的每一天",
    body: "生日、回歸、演唱會與那些只有你知道的重要日子。",
  },
  {
    Icon: Heart,
    eyebrow: "STAY CLOSE",
    title: "今天，也和他靠近一點",
    body: "一首歌、一個心情、幾秒鐘的小互動，就能留下今天。",
  },
  {
    Icon: Images,
    eyebrow: "KEEP THE MOMENTS",
    title: "讓喜歡慢慢變成回憶",
    body: "不用努力寫日記，IdolDays 會替你把走過的日子收好。",
  },
];

function IdolDaysIntro() {
  return (
    <main className="dreamy-bg paper-grain relative min-h-screen overflow-hidden bg-background text-foreground">
      <span
        aria-hidden
        className="twinkle pointer-events-none absolute top-28 left-[8%] text-xl text-primary/35"
      >
        ✦
      </span>
      <span
        aria-hidden
        className="twinkle pointer-events-none absolute top-52 right-[9%] text-lg text-lavender"
      >
        ♡
      </span>

      <div className="relative mx-auto w-full max-w-md px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <nav className="flex items-center justify-between">
          <Link
            to="/intro"
            className="font-display text-[25px] font-semibold tracking-tight text-primary"
          >
            IdolDays <span className="text-[18px]">♡</span>
          </Link>

          <Link
            to="/"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-border/70 bg-card/70 px-4 text-sm font-medium text-foreground backdrop-blur transition-all duration-300 active:scale-[0.98]"
          >
            開啟 App
          </Link>
        </nav>

        <section className="pt-14 text-center">
          <p className="text-xs font-semibold tracking-[0.18em] text-primary">
            CLOSER TO YOU
          </p>

          <h1 className="mt-4 font-display text-[36px] leading-[1.28] font-semibold tracking-[-0.025em]">
            把喜歡一個人的
            <br />
            <span className="text-primary">每一天留下來。</span>
          </h1>

          <p className="mx-auto mt-5 max-w-[19rem] text-[15px] leading-7 text-muted-foreground">
            不是在倒數日子，
            <br />
            而是在收藏我喜歡一個人的日子。
          </p>

          <div className="relative mx-auto mt-10 overflow-hidden rounded-[2.25rem] border border-border/70 bg-card/80 p-3 shadow-lift backdrop-blur-xl">
            <div className="relative h-[29rem] overflow-hidden rounded-[1.75rem] bg-gradient-to-b from-accent/60 via-background to-lavender/35">
              <div
                aria-hidden
                className="absolute -top-16 -right-12 size-56 rounded-full bg-card/70 blur-3xl"
              />
              <div
                aria-hidden
                className="absolute top-32 -left-20 size-52 rounded-full bg-primary/15 blur-3xl"
              />

              <div className="relative flex h-full flex-col px-5 pt-7 pb-5 text-left">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs tracking-[0.14em] text-muted-foreground">
                      TODAY ♡
                    </p>
                    <p className="mt-1 font-display text-[22px] font-semibold">
                      今天也一起追星吧
                    </p>
                  </div>
                  <Sparkles
                    className="size-5 text-primary"
                    strokeWidth={1.5}
                  />
                </div>

                <div className="mt-auto rounded-[1.8rem] border border-white/50 bg-card/75 p-5 shadow-soft backdrop-blur-xl">
                  <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground">
                    NEXT D-DAY
                  </p>

                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div>
                      <p className="font-display text-[19px] font-semibold">
                        下一次見面的日子
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        再一下下，就能見面了 ♡
                      </p>
                    </div>

                    <p className="font-display text-[42px] leading-none font-semibold text-primary">
                      D-12
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-[1.6rem] border border-border/60 bg-card/65 px-4 py-4 backdrop-blur-xl">
                  <p className="text-xs tracking-[0.14em] text-primary">
                    TODAY'S SONG ♡
                  </p>
                  <p className="mt-2 font-medium">♪ 今天想和他一起聽什麼？</p>
                  <div className="mt-3 flex gap-3 text-lg">
                    <span>🥹</span>
                    <span>💗</span>
                    <span>😭</span>
                    <span>✨</span>
                    <span>🔥</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-5 font-display text-[15px] italic text-primary/80">
            Closer to you, one day at a time.
          </p>
        </section>

        <section className="pt-20">
          <div className="text-center">
            <p className="text-xs font-semibold tracking-[0.16em] text-primary">
              OUR DAYS ♡
            </p>
            <h2 className="mt-3 font-display text-[26px] font-semibold">
              喜歡，不需要記得很辛苦。
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              你只需要留下幾秒鐘，
              <br />
              剩下的，讓 IdolDays 幫你記住。
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {moments.map(({ Icon, eyebrow, title, body }) => (
              <article
                key={title}
                className="cream-card flex gap-4 px-5 py-5"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/35 text-primary">
                  <Icon className="size-5" strokeWidth={1.5} />
                </div>

                <div>
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-primary">
                    {eyebrow}
                  </p>
                  <h3 className="mt-1 font-display text-[17px] font-semibold">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="pt-16">
          <div className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/15 via-card/85 to-lavender/30 px-6 py-9 text-center shadow-soft">
            <span
              aria-hidden
              className="absolute top-4 right-6 text-xl text-primary/30"
            >
              ✦
            </span>

            <p className="text-xs font-semibold tracking-[0.16em] text-primary">
              EVERY DAY CLOSER TO YOU
            </p>

            <h2 className="mt-3 font-display text-[25px] font-semibold">
              今天開始，
              <br />
              收藏我們的日子。
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              從今天的期待，到很久以後的回看。
            </p>

            <Link
              to="/"
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-all duration-300 active:scale-[0.98]"
            >
              開始我的 IdolDays
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <footer className="pt-12 text-center">
          <p className="font-display text-[18px] text-primary">IdolDays ♡</p>
          <p className="mt-1 text-xs tracking-[0.08em] text-muted-foreground">
            讓喜歡的日子，變成每天的風景。
          </p>
        </footer>
      </div>
    </main>
  );
}
