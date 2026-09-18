import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CloudRain,
  Headphones,
  Heart,
  Music2,
  Search,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/intro")({
  head: () => ({
    meta: [
      { title: "IdolDays｜MY IDOL. MY MUSIC. MY DAYS." },
      {
        name: "description",
        content:
          "為 K-POP 粉絲打造的私人追星陪伴 App。把喜歡一個人的每一天，都收好。",
      },
    ],
  }),
  component: IdolDaysIntro,
});

function IdolDaysIntro() {
  return (
    <main className="dreamy-bg paper-grain relative min-h-screen overflow-hidden bg-background text-foreground">
      <span
        aria-hidden
        className="twinkle pointer-events-none absolute top-28 left-[7%] text-xl text-primary/35"
      >
        ✦
      </span>
      <span
        aria-hidden
        className="twinkle pointer-events-none absolute top-56 right-[8%] text-lg text-lavender"
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
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-border/70 bg-card/75 px-4 text-sm font-medium backdrop-blur active:scale-[0.98]"
          >
            開啟 App
          </Link>
        </nav>

        {/* HERO */}
        <section className="pt-14 text-center">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-primary">
            MY IDOL. MY MUSIC. MY DAYS. ♡
          </p>

          <h1 className="mt-4 font-display text-[35px] leading-[1.28] font-semibold tracking-[-0.025em]">
            喜歡一個人之後，
            <br />
            <span className="text-primary">日子有了新的算法。</span>
          </h1>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {["COMEBACK D-7", "CONCERT D-23", "♡ 1,284 DAYS"].map(
              (item) => (
                <span
                  key={item}
                  className="rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-soft backdrop-blur"
                >
                  {item}
                </span>
              ),
            )}
          </div>

          <p className="mt-5 text-sm text-muted-foreground">
            把喜歡他的每一天，都收好。
          </p>

          {/* MAIN APP MOCKUP */}
          <div className="relative mx-auto mt-9 rounded-[2.3rem] border border-border/70 bg-card/85 p-3 shadow-lift backdrop-blur-xl">
            <div className="relative h-[30rem] overflow-hidden rounded-[1.8rem] bg-gradient-to-b from-accent/55 via-background to-lavender/30 text-left">
              <div className="absolute -top-16 -right-14 size-56 rounded-full bg-card/75 blur-3xl" />
              <div className="absolute top-36 -left-20 size-52 rounded-full bg-primary/15 blur-3xl" />

              <div className="relative flex h-full flex-col p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] tracking-[0.16em] text-muted-foreground">
                      TODAY ♡
                    </p>
                    <p className="mt-1 font-display text-[21px] font-semibold">
                      오늘도 좋은 하루 보내 ♡
                    </p>
                  </div>
                  <Sparkles
                    className="size-5 text-primary"
                    strokeWidth={1.5}
                  />
                </div>

                <div className="mt-6 flex flex-1 items-center justify-center">
                  <div className="relative h-40 w-32">
                    <div className="absolute left-1 top-4 h-32 w-24 -rotate-6 rounded-[1.25rem] border border-white/60 bg-card/65 shadow-soft" />
                    <div className="absolute right-0 top-0 flex h-36 w-28 rotate-3 items-center justify-center rounded-[1.3rem] border border-white/70 bg-gradient-to-b from-primary/15 to-card shadow-soft">
                      <Heart
                        className="size-9 text-primary/55"
                        strokeWidth={1.2}
                      />
                    </div>
                    <span className="absolute -right-2 bottom-1 rotate-6 font-display text-sm text-primary">
                      my bias ♡
                    </span>
                  </div>
                </div>

                <div className="rounded-[1.65rem] border border-white/55 bg-card/80 p-4 shadow-soft backdrop-blur-xl">
                  <p className="text-[10px] tracking-[0.14em] text-muted-foreground">
                    NEXT D-DAY
                  </p>

                  <div className="mt-2 flex items-end justify-between">
                    <div>
                      <p className="font-display text-[17px] font-semibold">
                        下一次見面的日子
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        再一下下 ♡
                      </p>
                    </div>
                    <p className="font-display text-[40px] leading-none font-semibold text-primary">
                      D-12
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-[1.45rem] border border-border/60 bg-card/65 px-4 py-3 backdrop-blur">
                  <div>
                    <p className="text-[10px] tracking-[0.14em] text-primary">
                      TODAY'S SONG ♡
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      ♪ Still With You
                    </p>
                  </div>
                  <span className="text-xl">🥹</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONCERT */}
        <section className="pt-20">
          <div className="text-center">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-primary">
              CONCERT D-DAY ✦
            </p>
            <h2 className="mt-3 font-display text-[28px] font-semibold">
              今天。真的。要。見。到。了。
            </h2>
          </div>

          <div className="relative mt-8 min-h-[24rem]">
            <div className="absolute left-1 top-4 w-[68%] -rotate-2 rounded-[1.8rem] border border-border/70 bg-card/90 p-5 shadow-lift">
              <p className="text-[10px] tracking-[0.16em] text-muted-foreground">
                THE DAY WE MEET ♡
              </p>
              <p className="mt-5 font-display text-[52px] leading-none text-primary">
                D-DAY
              </p>
              <p className="mt-4 font-display text-[19px] font-semibold">
                WORLD TOUR
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                2026.09.26 · SAT
              </p>

              <div className="mt-6 h-24 rounded-[1.2rem] bg-gradient-to-br from-primary/15 via-accent/35 to-lavender/40 p-4">
                <p className="text-xs text-muted-foreground">
                  SEE YOU TONIGHT
                </p>
                <p className="mt-2 font-display text-lg text-primary">
                  finally ♡
                </p>
              </div>
            </div>

            <div className="absolute right-0 top-44 w-[55%] rotate-3 rounded-[1.5rem] border border-white/60 bg-card/90 p-4 shadow-lift backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <CloudRain
                  className="size-5 text-primary"
                  strokeWidth={1.5}
                />
                <p className="text-[10px] tracking-[0.14em] text-primary">
                  FAN WEATHER
                </p>
              </div>
              <p className="mt-3 font-display text-[27px] font-semibold">
                24°
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                下午可能有雨 ☔
              </p>
              <p className="mt-3 text-xs leading-5">
                應援棒、票、雨傘。
                <br />
                好，出發。
              </p>
            </div>
          </div>

          <p className="text-center font-display text-[17px] text-primary">
            見本命已經夠緊張了，
            <br />
            天氣交給 IdolDays。
          </p>
        </section>

        {/* MUSIC */}
        <section className="pt-20">
          <div className="rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/12 via-card/90 to-lavender/30 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-primary">
                TODAY'S SONG ♡
              </p>
              <Headphones
                className="size-5 text-primary"
                strokeWidth={1.5}
              />
            </div>

            <div className="mt-6 flex gap-4">
              <div className="flex size-28 shrink-0 items-center justify-center rounded-[1.5rem] border border-white/60 bg-gradient-to-br from-accent/55 to-lavender/50 shadow-soft">
                <Music2
                  className="size-9 text-primary/65"
                  strokeWidth={1.3}
                />
              </div>

              <div className="flex min-w-0 flex-col justify-center">
                <p className="text-[10px] tracking-[0.14em] text-muted-foreground">
                  ♪ PLAYING
                </p>
                <p className="mt-2 font-display text-[20px] font-semibold">
                  Still With You
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  today's mood
                </p>
                <p className="mt-2 text-2xl">🥹</p>
              </div>
            </div>

            <div className="mt-6 h-1 overflow-hidden rounded-full bg-border/60">
              <div className="h-full w-[62%] rounded-full bg-primary/55" />
            </div>

            <div className="mt-6 flex justify-between text-xl">
              <span>🥹</span>
              <span>💗</span>
              <span>😭</span>
              <span>✨</span>
              <span>🔥</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-primary">
              THIS SONG = THAT DAY.
            </p>
            <h2 className="mt-3 font-display text-[25px] leading-snug font-semibold">
              前奏一下，
              <br />
              直接回到那一天。
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              有些歌，是有一段人生住在裡面。
            </p>
          </div>
        </section>

        {/* ARCHAEOLOGY */}
        <section className="pt-20">
          <div className="text-center">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-primary">
              FAN ARCHAEOLOGY MODE : ON
            </p>
            <h2 className="mt-3 font-display text-[25px] leading-snug font-semibold">
              「等一下，
              <br />
              這個我怎麼現在才看到？？？」
            </h2>
          </div>

          <div className="mt-8 rounded-[2rem] border border-border/70 bg-card/80 p-5 shadow-soft">
            <div className="flex items-center gap-2 border-b border-border/60 pb-4">
              <Search
                className="size-4 text-muted-foreground"
                strokeWidth={1.5}
              />
              <span className="text-xs text-muted-foreground">
                我的考古收藏
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ["THREADS", "that moment ♡"],
                ["YOUTUBE", "2019 fancam"],
                ["X", "legendary stage"],
                ["TIKTOK", "save this !!"],
              ].map(([source, title], index) => (
                <div
                  key={`${source}-${title}`}
                  className={`rounded-[1.35rem] border border-border/60 bg-background/70 p-3 ${
                    index === 1 ? "translate-y-3" : ""
                  }`}
                >
                  <div className="flex h-20 items-center justify-center rounded-[1rem] bg-gradient-to-br from-accent/40 to-lavender/35">
                    <Heart
                      className="size-5 text-primary/55"
                      strokeWidth={1.3}
                    />
                  </div>
                  <p className="mt-3 text-[9px] font-semibold tracking-[0.12em] text-primary">
                    {source}
                  </p>
                  <p className="mt-1 text-xs">{title}</p>
                </div>
              ))}
            </div>

            <p className="mt-7 text-center font-display text-[16px] text-primary">
              收藏先。睡覺等一下再說。
            </p>
          </div>
        </section>

        {/* MEMORIES */}
        <section className="pt-20">
          <div className="text-center">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-primary">
              OUR MEMORIES ♡
            </p>
            <h2 className="mt-3 font-display text-[27px] font-semibold">
              那天真的好幸福。
            </h2>
          </div>

          <div className="relative mx-auto mt-8 h-[24rem] max-w-[20rem]">
            <div className="absolute left-2 top-10 w-44 -rotate-6 rounded-[1.25rem] border border-border/70 bg-card p-3 pb-5 shadow-lift">
              <div className="flex h-40 items-center justify-center rounded-[0.9rem] bg-gradient-to-br from-accent/45 to-primary/15">
                <Sparkles
                  className="size-7 text-primary/55"
                  strokeWidth={1.3}
                />
              </div>
              <p className="mt-3 font-display text-sm">
                first concert ♡
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                2026.09.26
              </p>
            </div>

            <div className="absolute right-1 top-2 w-40 rotate-6 rounded-[1.25rem] border border-border/70 bg-card p-3 pb-5 shadow-lift">
              <div className="flex h-36 items-center justify-center rounded-[0.9rem] bg-gradient-to-br from-lavender/45 to-accent/45">
                <Heart
                  className="size-7 text-primary/50"
                  strokeWidth={1.3}
                />
              </div>
              <p className="mt-3 font-display text-sm">
                our day ✦
              </p>
            </div>

            <div className="absolute bottom-2 left-20 w-44 rotate-2 rounded-[1.25rem] border border-border/70 bg-card p-3 shadow-lift">
              <p className="text-[9px] tracking-[0.14em] text-primary">
                MEMORY NOTE
              </p>
              <p className="mt-2 font-display text-[15px] leading-6">
                回家之後還是一直在想今天。
              </p>
              <p className="mt-2 text-lg">🥹 ♡</p>
            </div>
          </div>
        </section>

        {/* WIDGET */}
        <section className="pt-20 text-center">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-primary">
            BIAS ON MY HOME SCREEN ♡
          </p>
          <h2 className="mt-3 font-display text-[28px] font-semibold">
            看時間 ❌
            <br />
            看本命 ✅
          </h2>

          <div className="mx-auto mt-8 max-w-[18rem] rounded-[2.8rem] border-[5px] border-foreground/75 bg-background p-3 shadow-lift">
            <div className="relative min-h-[27rem] overflow-hidden rounded-[2rem] bg-gradient-to-b from-accent/45 via-background to-lavender/35 p-4 text-left">
              <div className="mx-auto h-5 w-20 rounded-full bg-foreground/80" />

              <p className="mt-6 text-right text-xs text-muted-foreground">
                09:26
              </p>

              <div className="mt-20 rounded-[1.6rem] border border-white/60 bg-card/80 p-4 shadow-soft backdrop-blur">
                <div className="flex justify-between">
                  <div>
                    <p className="text-[9px] tracking-[0.14em] text-primary">
                      IDOLDAYS ♡
                    </p>
                    <p className="mt-2 font-display text-lg font-semibold">
                      다음에 만나는 날
                    </p>
                  </div>
                  <Heart
                    className="size-5 text-primary"
                    strokeWidth={1.4}
                  />
                </div>

                <p className="mt-7 font-display text-[42px] leading-none text-primary">
                  D-12
                </p>

                <div className="mt-5 border-t border-border/60 pt-3">
                  <p className="text-[10px] text-muted-foreground">
                    TODAY'S MOOD
                  </p>
                  <p className="mt-1">🥹　♪ Still With You</p>
                </div>
              </div>

              <div className="mt-5 flex justify-center gap-4 text-lg opacity-70">
                <span>♡</span>
                <span>✦</span>
                <span>♪</span>
              </div>
            </div>
          </div>
        </section>

        {/* QUIET MOMENT */}
        <section className="pt-20 text-center">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-primary">
            JUST YOUR DAYS.
          </p>
          <h2 className="mt-3 font-display text-[26px] leading-snug font-semibold">
            有時候，
            <br />
            只是來看看他也很好。
          </h2>
          <p className="mx-auto mt-4 max-w-[18rem] text-sm leading-6 text-muted-foreground">
            不用打卡，也不用證明自己有多喜歡。
            <br />
            這裡只是你自己的追星小世界。
          </p>
        </section>

        {/* END */}
        <section className="pt-20">
          <div className="relative overflow-hidden rounded-[2.1rem] border border-primary/15 bg-gradient-to-br from-primary/15 via-card/90 to-lavender/30 px-6 py-10 text-center shadow-lift">
            <span
              aria-hidden
              className="absolute left-5 top-5 text-lg text-primary/30"
            >
              ♡
            </span>
            <span
              aria-hidden
              className="absolute right-6 top-8 text-lg text-primary/30"
            >
              ✦
            </span>

            <p className="text-[10px] font-semibold tracking-[0.16em] text-primary">
              ONE DAY, THIS WILL ALL BECOME A MEMORY.
            </p>

            <div className="mx-auto mt-8 flex w-48 items-end justify-center gap-2">
              <div className="h-20 w-16 -rotate-6 rounded-lg border border-white/60 bg-accent/50 shadow-soft" />
              <div className="h-24 w-20 rounded-lg border border-white/60 bg-primary/15 shadow-soft" />
              <div className="h-20 w-16 rotate-6 rounded-lg border border-white/60 bg-lavender/50 shadow-soft" />
            </div>

            <h2 className="mt-8 font-display text-[26px] leading-[1.45] font-semibold">
              不是倒數還剩幾天。
              <br />
              <span className="text-primary">
                是收藏我們一起走過多少天。 ♡
              </span>
            </h2>

            <p className="mt-5 text-[11px] font-semibold tracking-[0.16em] text-primary">
              MY IDOL. MY MUSIC. MY DAYS.
            </p>

            <Link
              to="/"
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft active:scale-[0.98]"
            >
              開始我的 IdolDays
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <footer className="pt-12 text-center">
          <p className="font-display text-[18px] text-primary">
            IdolDays ♡
          </p>
          <p className="mt-1 text-[10px] tracking-[0.12em] text-muted-foreground">
            EVERY DAY WITH YOU, KEPT HERE. ✦
          </p>
        </footer>
      </div>
    </main>
  );
}
