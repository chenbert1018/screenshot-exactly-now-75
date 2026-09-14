import { StoredImage } from "@/components/StoredImage";
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Heart, ImageIcon, Plus, User } from "lucide-react";
import { AppShell, Section, EmptyState, SoftCard } from "@/components/AppShell";
import type { Idol } from "@/lib/idols";
import { useIdolSource } from "@/lib/idols.source";
import { eventCountdown, eventTypeMeta, nextEvent, type IdolEvent } from "@/lib/events";
import { useEventSource } from "@/lib/events.source";
import { daysSince, nextAnniversary, primaryDay, parseLocalDate } from "@/lib/dates";

import {
  dailyMessage,
  formatDotDate,
  todayFullLabel,
  todayWeekday,
} from "@/lib/companion";
import {
  birthdayDdayLine,
  debutDdayLine,
  eventDdayLine,
  yearsAgoLine,
} from "@/lib/fanCopy";
import { dailySugarPick, type HeartItem } from "@/lib/heart";
import { useSugarSource } from "@/lib/sugar.source";
import { HeartFormSheet } from "@/components/HeartFormSheet";
import { HeartDetailSheet, dotDate } from "@/components/HeartDetailSheet";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

function CountdownHero({ idol, event }: { idol: Idol; event?: IdolEvent | undefined }) {
  const day = primaryDay(idol);
  const source = day?.kind === "birthday" ? idol.birthday : idol.debutDate;
  const anniversary = nextAnniversary(source);
  const countdown = event ? eventCountdown(event.date) : null;

  const next =
    event && countdown
      ? {
          days: countdown.daysUntil ?? 0,
          dateLabel: countdown.dotDate,
          titleLabel: event.title,
        }
      : day && anniversary
        ? {
            days: day.daysUntil,
            dateLabel: formatDotDate(anniversary.nextDate),
            titleLabel: `${idol.name} 的${day.title}`,
          }
        : null;

  const isToday = next?.days === 0;

  return (
    <section className="-mx-5">
      <div className="relative overflow-hidden bg-gradient-to-b from-[#fde8ef] via-[#fdf1f4] to-background px-3 pb-3">

        {/* Dreamy cutout Hero */}
        <Link
          to="/idols/$idolId"
          params={{ idolId: idol.id }}
          className="relative block h-[360px] overflow-hidden rounded-[1.8rem] bg-gradient-to-b from-[#f8dce8] via-[#fae7ee] to-[#f7dfe7]"
        >
          {idol.photo ? (
            <StoredImage
              src={idol.photo}
              alt=""
              aria-hidden
              className="absolute inset-0 size-full scale-110 object-cover object-center opacity-20 blur-2xl"
            />
          ) : null}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-[#f7dfe7]/90" />
          <div className="pointer-events-none absolute -left-16 top-6 size-64 rounded-full bg-[#f5c8d9]/45 blur-3xl" />
          <div className="pointer-events-none absolute -right-14 top-20 size-56 rounded-full bg-white/65 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-10 bottom-16 h-20 rounded-full bg-[#efbfd0]/30 blur-2xl" />

          <span className="pointer-events-none absolute left-5 top-12 z-20 text-lg text-primary/35">
            ✦
          </span>
          <span className="pointer-events-none absolute right-6 top-24 z-20 text-xl text-primary/25">
            ✧
          </span>
          <span className="pointer-events-none absolute left-9 bottom-28 z-20 text-primary/30">
            ♡
          </span>

          {idol.cutoutPhoto ? (
            <StoredImage
              src={idol.cutoutPhoto}
              alt={`${idol.name} 的去背照片`}
              className="absolute inset-x-0 bottom-0 z-10 mx-auto h-[95%] w-full object-contain object-bottom"
            />
          ) : idol.photo ? (
            <StoredImage
              src={idol.photo}
              alt={`${idol.name} 的照片`}
              className="absolute inset-0 z-10 size-full object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageIcon className="size-8" strokeWidth={1.3} />
              <span className="text-sm">放一張你喜歡的照片 ♡</span>
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-36 bg-gradient-to-t from-[#f7dfe7] via-[#f7dfe7]/58 to-transparent" />

          <div className="absolute inset-x-5 bottom-9 z-30 text-center">
            <p className="font-display text-[22px] font-medium text-foreground/90">
              今天也一起追星吧 ♡
            </p>
            <p className="mt-1 text-[11px] tracking-[0.12em] text-muted-foreground">
              {idol.groupName ? `${idol.groupName} · ${idol.name}` : idol.name}
            </p>
          </div>
        </Link>

        {/* D-Day card */}
        {next ? (
          <Link
            to={event ? "/events" : "/idols/$idolId"}
            params={event ? undefined : { idolId: idol.id }}
            className="relative z-20 mx-2 -mt-5 block rounded-[1.8rem] border border-white/80 bg-white/90 px-5 py-4 shadow-[0_12px_32px_rgba(146,92,112,0.12)] backdrop-blur-xl transition-transform active:scale-[0.99]"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-medium tracking-[0.18em] text-primary uppercase">
                  Next D-Day
                </p>

                <p className="mt-1.5 truncate text-[15px] font-medium">
                  {next.titleLabel}
                </p>

                <p className="mt-1 text-[11px] text-muted-foreground">
                  {next.dateLabel}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="font-display text-[38px] font-semibold leading-none text-primary">
                  {isToday ? "TODAY" : `D-${next.days}`}
                </p>
              </div>
            </div>
          </Link>
        ) : (
          <Link
            to="/idols/$idolId"
            params={{ idolId: idol.id }}
            className="relative z-20 mx-2 -mt-5 block rounded-[1.8rem] border border-white/80 bg-white/90 px-5 py-4 text-center shadow-soft"
          >
            <p className="text-sm font-medium">還沒有下一個重要日子</p>
            <p className="mt-1 text-xs text-muted-foreground">
              設定生日、演唱會或紀念日 ♡
            </p>
          </Link>
        )}
      </div>
    </section>
  );
}

function Companionship({ idol }: { idol: Idol }) {
  const since = daysSince(idol.sinceDate);

  if (!since || since.isFuture || since.days === null) {
    return null;
  }

  return (
    <Link
      to="/idols/$idolId"
      params={{ idolId: idol.id }}
      className="mt-3 flex items-center justify-between rounded-[1.7rem] border border-white/80 bg-white/90 px-5 py-3.5 shadow-soft backdrop-blur-md transition-transform active:scale-[0.99]"
    >
      <div className="flex items-end gap-3">
        <div>
          <p className="text-[11px] tracking-[0.12em] text-primary">
            陪伴他走過
          </p>

          <div className="mt-1 flex items-end gap-2">
            <span className="font-display text-[30px] font-semibold leading-none">
              {since.days}
            </span>

            <span className="pb-0.5 text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              Days
            </span>
          </div>
        </div>
      </div>

      <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        ♡
      </div>
    </Link>
  );
}

function TodaySection({ name }: { name?: string }) {
  return (
    <section className="text-center">
      <p className="text-[13px] tracking-[0.34em] text-muted-foreground uppercase">Today</p>
      <p className="mt-3 text-[17px]">{todayFullLabel()}</p>
      <p className="mt-1 text-sm text-muted-foreground">{todayWeekday()}</p>
      <p className="mt-5 text-[15px] leading-relaxed">{dailyMessage(name)}</p>
    </section>
  );
}

function KeepToday({ idol }: { idol?: Idol }) {
  const [kept, setKept] = useState(false);
  const since = idol ? daysSince(idol.sinceDate) : null;
  const text =
    idol && since && !since.isFuture
      ? `已經喜歡 ${idol.name} ${since.days} 天了，怎麼還是每天都在被電 🥹`
      : "今天也留給自己一點追星時間啦。";

  return (
    <SoftCard className="px-6 py-7 text-center">
      <p className="text-xs tracking-wide text-muted-foreground">今天也想記一下</p>
      <p className="mt-3 text-[15px] leading-relaxed">{text}</p>
      {kept ? (
        <p className="mt-5 text-sm text-primary">好啦，今天先收起來 ♡</p>
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

/** 首頁糖區：只回顧已收藏的糖，不會產生任何新資料 */
function SugarSection({
  pick,
  idolName,
  onOpen,
  onCreate,
}: {
  pick: HeartItem | null;
  idolName: string;
  onOpen: () => void;
  onCreate: () => void;
}) {
  return (
    <section className="mt-9">
      <h2 className="font-display text-[17px]">🍬 今天也有一顆糖嗎？</h2>
      {pick ? (
        <>
          <p className="mt-1.5 text-sm text-muted-foreground">這顆我可以嗑很久 👀</p>
          <SoftCard className="mt-3 overflow-hidden p-0">
            {pick.image ? (
              <StoredImage
                src={pick.image}
                alt={pick.title}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : null}
            <div className="px-5 py-4">
              <p className="font-display text-[16px] leading-snug">{pick.title}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {dotDate(pick.date)}・{idolName}
              </p>
              <button
                type="button"
                onClick={onOpen}
                className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
              >
                去嗑這顆 →
              </button>
            </div>
          </SoftCard>
        </>
      ) : (
        <div className="mt-3 rounded-3xl border border-border/60 bg-card/70 px-5 py-5 shadow-soft">
          <p className="text-sm text-muted-foreground">還沒有收藏的糖，先去存一顆吧 ♡</p>
          <button
            type="button"
            onClick={onCreate}
            className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
          >
            去收藏第一顆糖 →
          </button>
        </div>
      )}
    </section>
  );
}

function YearsAgo() {
  return (
    <section className="text-center">
      <p className="text-xs tracking-wide text-muted-foreground">幾年前的今天</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{yearsAgoLine()}</p>
    </section>
  );
}

function HomePage() {
  const { idols, ready, findIdol, mainIdol } = useIdolSource();
  const [heartOpen, setHeartOpen] = useState(false);
  const { items: sugarItems, add: addSugar, update: updateSugar, remove: removeSugar } =
    useSugarSource();
  const [sugarDetail, setSugarDetail] = useState<HeartItem | null>(null);
  const [sugarEditing, setSugarEditing] = useState<HeartItem | null>(null);
  const [sugarPendingDelete, setSugarPendingDelete] = useState<HeartItem | null>(null);
  // 每天固定挑一顆「已收藏」的糖回顧，不會建立任何新資料
  const dailySugar = useMemo(() => dailySugarPick(sugarItems), [sugarItems]);
  const sugarIdolName = (id: string) => idols.find((i) => i.id === id)?.name || "已刪除的偶像";
  const { events } = useEventSource();
  const main = mainIdol;
  const others = idols.filter((i) => i.id !== main?.id);

  // NEXT D-DAY 優先使用最近的 Event（找不到對應偶像時仍以主要偶像呈現）
  const upcomingEvent = nextEvent(events);
  const heroIdol =
    (upcomingEvent ? findIdol(upcomingEvent.idolId) : undefined) ?? main;

  return (
    <AppShell showProfileShortcut={false}>
      <header className="mb-1 flex h-10 items-center justify-between">
        <p className="font-display text-[24px] font-semibold tracking-[-0.02em] text-primary">
          IdolDays
        </p>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="relative flex size-9 items-center justify-center rounded-full border border-white/70 bg-white/75 shadow-soft backdrop-blur-md"
            aria-label="通知"
          >
            <Bell className="size-[18px]" strokeWidth={1.6} />
            <span className="absolute right-1 top-1 size-2 rounded-full bg-primary" />
          </button>

          <Link
            to="/profile"
            aria-label="我的"
            className="flex size-9 items-center justify-center rounded-full border border-white/70 bg-white/75 text-muted-foreground shadow-soft backdrop-blur-md transition-transform active:scale-95"
          >
            <User className="size-[18px]" strokeWidth={1.6} />
          </Link>
        </div>
      </header>

      {!ready ? (
        <div className="h-72 rounded-3xl border border-border/60 bg-surface/40" aria-hidden />
      ) : main && heroIdol ? (
        <>
          <CountdownHero idol={heroIdol} event={upcomingEvent} />

          <Divider />
          <Companionship idol={main} />
          <Divider />
          <TodaySection name={main.name} />
          <div className="mt-9">
            <KeepToday idol={main} />
          </div>
          <SugarSection
            pick={dailySugar}
            idolName={dailySugar ? sugarIdolName(dailySugar.idolId) : ""}
            onOpen={() => setSugarDetail(dailySugar)}
            onCreate={() => setHeartOpen(true)}
          />
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
          <SugarSection
            pick={dailySugar}
            idolName={dailySugar ? sugarIdolName(dailySugar.idolId) : ""}
            onOpen={() => setSugarDetail(dailySugar)}
            onCreate={() => setHeartOpen(true)}
          />
          <Divider />
          <YearsAgo />
        </>
      )}

      <HeartDetailSheet
        item={sugarDetail}
        idolName={sugarDetail ? sugarIdolName(sugarDetail.idolId) : ""}
        onOpenChange={(open) => {
          if (!open) setSugarDetail(null);
        }}
        onEdit={() => {
          if (!sugarDetail) return;
          setSugarEditing(sugarDetail);
          setHeartOpen(true);
        }}
        onDelete={() => sugarDetail && setSugarPendingDelete(sugarDetail)}
      />

      <HeartFormSheet
        open={heartOpen}
        onOpenChange={(open) => {
          setHeartOpen(open);
          if (!open) setSugarEditing(null);
        }}
        idols={idols}
        initial={
          sugarEditing
            ? {
                idolId: sugarEditing.idolId,
                title: sugarEditing.title,
                date: sugarEditing.date,
                type: sugarEditing.type,
                note: sugarEditing.note ?? "",
                image: sugarEditing.image ?? "",
                link: sugarEditing.link ?? "",
              }
            : undefined
        }
        title={sugarEditing ? "編輯這顆糖" : "收藏這顆糖 ♡"}
        submitLabel="收藏這顆糖 ♡"
        onSubmit={(draft) => {
          if (sugarEditing) {
            void updateSugar(sugarEditing.id, draft);
            toast("這顆糖更新好了 ♡");
          } else {
            void addSugar(draft);
            toast("收好了 ♡", { description: "這顆糖以後可以慢慢嗑。" });
          }
          setHeartOpen(false);
          setSugarEditing(null);
          setSugarDetail(null);
        }}
      />

      <AlertDialog
        open={!!sugarPendingDelete}
        onOpenChange={(open) => {
          if (!open) setSugarPendingDelete(null);
        }}
      >
        <AlertDialogContent className="max-w-[20rem] rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>這顆真的要刪掉嗎……🥹</AlertDialogTitle>
            <AlertDialogDescription>
              刪掉之後，就不會再出現在你的糖庫裡了。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">留下這顆糖</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground"
              onClick={() => {
                if (sugarPendingDelete) void removeSugar(sugarPendingDelete.id);
                setSugarPendingDelete(null);
                setSugarDetail(null);
              }}
            >
              還是刪掉
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Link
        to="/memories"
        className="mt-10 flex items-center justify-between rounded-3xl border border-border/60 bg-card/70 px-5 py-4 shadow-soft transition-transform duration-300 active:scale-[0.98]"
      >
        <span className="text-sm">把喜歡過的每一天，留在這裡 ♡</span>
        <span aria-hidden className="text-primary">
          →
        </span>
      </Link>
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
          <StoredImage
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
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
          {day ? day.ddayLabel : "設定重要日子"}
        </p>
      </div>
    </Link>
  );
}
