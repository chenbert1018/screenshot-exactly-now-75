import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Archive,
  ArrowRight,
  BellRing,
  CalendarDays,
  CloudSun,
  Heart,
  Images,
  Sparkles,
  Stars,
  Smartphone,
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

const features = [
  { Icon: CalendarDays, title: "重要日子倒數", body: "演唱會、回歸、生日、簽售與見面會，所有期待都不錯過。" },
  { Icon: CloudSun, title: "追星天氣", body: "出發前先看活動地點的溫度與降雨機率，幫你準備好見面的那一天。" },
  { Icon: Archive, title: "粉絲考古", body: "把 Threads、舞台、名場面與影片連結，收成自己的追星收藏庫。" },
  { Icon: Images, title: "回憶夾", body: "用照片、日期與心得，留下每一次現場和心動。" },
  { Icon: BellRing, title: "iPhone 提醒", body: "把重要日子直接排進本機通知，不讓期待悄悄錯過。" },
  { Icon: Smartphone, title: "桌面陪伴", body: "本命、D-Day、每日一句，讓追星的陪伴留在 iPhone 桌面。" },
];

function IdolDaysIntro() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7fbff] text-[#1f3f6b]">
      <section className="relative isolate overflow-hidden px-5 pb-16 pt-[max(2rem,env(safe-area-inset-top))] sm:px-8">
        <div aria-hidden className="absolute -left-32 -top-40 -z-10 size-[28rem] rounded-full bg-[#dcecff] blur-3xl" />
        <div aria-hidden className="absolute -right-24 top-32 -z-10 size-80 rounded-full bg-[#decfff]/70 blur-3xl" />
        <div className="mx-auto max-w-5xl">
          <nav className="flex items-center justify-between">
            <Link to="/intro" className="flex items-center gap-2 text-xl font-semibold tracking-tight text-[#3265ae]">
              <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-[#a7c7ff] via-[#d8c9ff] to-[#5b7fc9] text-white shadow-[0_8px_22px_rgb(74_144_226_/_0.25)]"><Stars className="size-4" /></span>
              IdolDays
            </Link>
            <Link to="/" className="rounded-full border border-[#cfe0f7] bg-white/80 px-4 py-2 text-sm font-medium text-[#315b8d] backdrop-blur transition hover:bg-white">開啟 App</Link>
          </nav>

          <div className="grid items-center gap-12 pt-16 md:grid-cols-[1.1fr_.9fr] md:pt-24">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#cddfff] bg-white/75 px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-[#4a90e2] uppercase"><Sparkles className="size-3.5" /> Your private fandom diary</p>
              <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.18] tracking-tight text-[#1f3f6b] sm:text-5xl">把喜歡一個人的<br /><span className="bg-gradient-to-r from-[#4a90e2] via-[#7d92e8] to-[#bd8be4] bg-clip-text text-transparent">每一天留下來。</span></h1>
              <p className="mt-5 max-w-lg text-lg leading-8 text-[#547393]">IdolDays 是為 K-POP 粉絲打造的私人追星陪伴 App。從下一個 D-Day，到多年後回看的回憶，每一份心動都有地方安放。</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-[#4a90e2] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgb(74_144_226_/_0.28)] transition hover:-translate-y-0.5">開始收藏我的日子 <ArrowRight className="size-4" /></Link>
                <a href="#features" className="rounded-full border border-[#c8dcf6] bg-white/75 px-5 py-3 text-sm font-semibold text-[#315b8d] transition hover:bg-white">看看功能</a>
              </div>
              <p className="mt-5 text-sm text-[#6d87a7]">不只是倒數，而是和喜歡的人一起走過的日子。</p>
            </div>

            <div className="relative mx-auto w-full max-w-[20rem] rotate-2 rounded-[2.7rem] border-[7px] border-slate-950 bg-slate-950 p-1.5 shadow-[0_28px_70px_rgb(31_63_107_/_0.3)]">
              <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-950" />
              <div className="overflow-hidden rounded-[2.2rem] bg-gradient-to-b from-[#dcecff] via-[#f8fbff] to-[#e4ddff] px-4 pb-5 pt-12">
                <div className="flex items-center justify-between text-xs font-semibold text-[#315b8d]"><span>IdolDays</span><BellRing className="size-4" /></div>
                <div className="mt-4 h-48 rounded-[1.6rem] bg-[radial-gradient(circle_at_55%_28%,rgba(255,255,255,.95),transparent_20%),linear-gradient(145deg,#83b4ef,#b2cdfb_52%,#d9ccfb)] p-5 text-white shadow-inner">
                  <div className="flex justify-end"><Sparkles className="size-6" /></div>
                  <div className="mt-16"><p className="text-xs tracking-[0.14em] uppercase text-white/80">오늘도 우리예요</p><p className="mt-1 text-xl font-semibold">帶著好心情，<br />去見喜歡的人吧。</p></div>
                </div>
                <div className="mt-3 rounded-3xl bg-white/90 p-4 shadow-[0_10px_25px_rgb(74_144_226_/_0.12)]"><p className="text-[10px] font-semibold tracking-[0.14em] text-[#6d87a7] uppercase">Next D-Day</p><div className="mt-1 flex items-center justify-between"><div><p className="font-semibold text-[#274d7d]">台北演唱會</p><p className="mt-1 text-xs text-[#6d87a7]">2026.09.17</p></div><p className="text-3xl font-semibold text-[#4a90e2]">D-1</p></div></div>
                <div className="mt-3 flex items-center gap-3 rounded-3xl bg-white/80 p-3"><div className="grid size-10 place-items-center rounded-2xl bg-[#e6e2ff] text-[#6f79ce]"><CloudSun className="size-5" /></div><div><p className="text-xs font-semibold text-[#4a90e2]">Fan Weather</p><p className="text-sm font-medium text-[#315b8d]">舒適 · 23–30°C</p></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-white px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-5xl"><div className="max-w-xl"><p className="text-sm font-semibold text-[#4a90e2]">ONE APP, EVERY FAN MOMENT</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#1f3f6b]">讓追星不再散落在<br />相簿、記事本與收藏夾裡。</h2></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{features.map(({ Icon, title, body }) => <article key={title} className="rounded-[1.7rem] border border-[#e0eaf7] bg-[#fbfdff] p-5 shadow-[0_10px_26px_rgb(74_144_226_/_0.06)]"><div className="grid size-11 place-items-center rounded-2xl bg-[#e7f0ff] text-[#4a90e2]"><Icon className="size-5" /></div><h3 className="mt-5 text-lg font-semibold text-[#274d7d]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#6d87a7]">{body}</p></article>)}</div></div>
      </section>

      <section className="px-5 py-16 sm:px-8"><div className="mx-auto grid max-w-5xl items-center gap-8 rounded-[2rem] bg-gradient-to-br from-[#315f9e] via-[#527fce] to-[#9982d9] px-6 py-10 text-white shadow-[0_24px_56px_rgb(49_95_158_/_0.3)] sm:px-10 md:grid-cols-[1fr_auto]"><div><p className="inline-flex items-center gap-2 text-sm font-medium text-white/80"><Heart className="size-4 fill-current" /> FOR EVERY FANDOM MOMENT</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">從今天的期待，到很久以後的回看。</h2><p className="mt-3 max-w-2xl leading-7 text-white/80">把本命、重要日子與你的故事，收進只屬於自己的 IdolDays。</p></div><Link to="/" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#315b8d] transition hover:-translate-y-0.5">開啟 IdolDays <ArrowRight className="size-4" /></Link></div></section>

      <footer className="border-t border-[#dfe9f7] bg-white px-5 py-7 text-center text-sm text-[#6d87a7]">IdolDays · Count the good days.</footer>
    </main>
  );
}