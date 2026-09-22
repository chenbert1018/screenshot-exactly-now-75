import { StoredImage } from "@/components/StoredImage";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarPlus, ChevronLeft, ImageIcon, Images, Music2, Pencil } from "lucide-react";
import { AppShell, SoftCard } from "@/components/AppShell";
import { IdolFormSheet } from "@/components/IdolFormSheet";
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
import type { IdolDraft } from "@/lib/idols";
import { useIdolSource } from "@/lib/idols.source";
import { ReminderSheet } from "@/components/ReminderSheet";
import { DEFAULT_DAYS_BEFORE, formatDaysBefore, type ReminderType } from "@/lib/reminders";
import { useReminderSource } from "@/lib/reminders.source";
import { Bell } from "lucide-react";
import { daysSince, primaryDay, nextAnniversary } from "@/lib/dates";

export const Route = createFileRoute("/idols/$idolId")({
  head: () => ({
    meta: [
      { title: "偶像日子｜IdolDays" },
      { name: "description", content: "查看這位偶像的生日、出道日與你喜歡他的日子。" },
      { property: "og:title", content: "偶像日子｜IdolDays" },
      { property: "og:description", content: "查看這位偶像的生日、出道日與你喜歡他的日子。" },
    ],
  }),
  component: IdolDetailPage,
});

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/50 py-3 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-[15px]">{value || "未填寫"}</span>
    </div>
  );
}

function IdolDetailPage() {
  const { idolId } = Route.useParams();
  const navigate = useNavigate();
  const { ready, updateIdol, removeIdol, findIdol } = useIdolSource();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [reminderKind, setReminderKind] = useState<ReminderType | null>(null);
  const { reminderFor, setReminderFor, removeRemindersForIdol } = useReminderSource();

  const idol = findIdol(idolId);

  if (!ready) {
    return (
      <AppShell>
        <div className="h-40" />
      </AppShell>
    );
  }

  if (!idol) {
    return (
      <AppShell>
        <p className="mt-16 text-center text-sm text-muted-foreground">找不到這位偶像</p>
        <div className="mt-5 flex justify-center">
          <Link
            to="/idols"
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft"
          >
            回到我的偶像
          </Link>
        </div>
      </AppShell>
    );
  }

  async function handleSave(draft: IdolDraft) {
    if (!idol) return;
    await updateIdol(idol.id, draft);
    setEditing(false);
  }

  async function handleDelete() {
    if (!idol) return;
    await removeRemindersForIdol(idolId);
    await removeIdol(idol.id);
    setConfirming(false);
    setEditing(false);
    navigate({ to: "/idols" });
  }

  const { id: _id, ...draft } = idol;
  const day = primaryDay(idol);
  const since = daysSince(idol.sinceDate);
  const debut = nextAnniversary(idol.debutDate);
  const birthdayReminder = reminderFor({ type: "BIRTHDAY", idolId });
  const debutReminder = reminderFor({ type: "ANNIVERSARY", idolId });

  return (
    <AppShell>
      <div className="mb-5 flex items-center justify-between">
        <Link to="/idols" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronLeft className="size-4" strokeWidth={1.8} />
          我的本命
        </Link>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/65 px-3.5 py-1.5 text-xs text-muted-foreground shadow-soft transition-transform duration-300 active:scale-95"
        >
          <Pencil className="size-3.5" strokeWidth={1.8} />
          編輯
        </button>
      </div>

      <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-soft">
        <span
          aria-hidden
          className="pointer-events-none absolute top-4 right-5 z-10 text-xl text-primary/35"
        >
          ✦
        </span>
        <div className="aspect-[4/5] w-full bg-gradient-to-b from-accent/35 via-surface to-card">
          {idol.photo ? (
            <StoredImage
              src={idol.photo}
              alt={`${idol.name} 的照片`}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageIcon className="size-7" strokeWidth={1.3} />
              <span className="text-xs">放一張你最喜歡的照片</span>
            </div>
          )}
        </div>
        <div className="px-6 py-6 text-center">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-primary">我的本命 ♡</p>
          <h1 className="mt-1.5 font-display text-[28px] font-semibold">{idol.name}</h1>
          {idol.groupName ? (
            <p className="mt-1.5 text-sm text-muted-foreground">{idol.groupName}</p>
          ) : null}
        </div>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <SoftCard className="relative overflow-hidden px-4 py-5 text-center">
          <span aria-hidden className="absolute top-3 right-3 text-primary/15">
            ✦
          </span>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground">
            下一個 D-DAY ♡
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{day ? day.title : "下一個重要日子"}</p>
          <p className="mt-2 font-display text-[28px] leading-none font-semibold text-primary">
            {day ? day.ddayLabel : "—"}
          </p>
          <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
            {day ? day.humanLabel : "等你留下一個期待"}
          </p>
        </SoftCard>
        <SoftCard className="px-4 py-5 text-center">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground">
            一起走過 ♡
          </p>
          <p className="mt-1 text-xs text-muted-foreground">我們一起走過</p>
          <p className="mt-2 font-display text-[28px] leading-none font-semibold text-primary">
            {since ? since.ddayLabel : "—"}
          </p>
          <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
            {since ? since.humanLabel : "從哪一天開始喜歡他？"}
          </p>
        </SoftCard>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Link to="/events" search={{ idol: idol.id } as never} className="flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl bg-primary px-2 text-xs font-medium text-primary-foreground shadow-soft transition-transform active:scale-[0.98]">
          <CalendarPlus className="size-4" strokeWidth={1.8} /><span>日子</span>
        </Link>
        <Link to="/memories" search={{ create: "1", idol: idol.id } as never} className="flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl bg-surface px-2 text-xs font-medium transition-transform active:scale-[0.98]">
          <Images className="size-4 text-primary" strokeWidth={1.8} /><span>回憶</span>
        </Link>
        <Link to="/music" search={{ idol: idol.id } as never} className="flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl bg-surface px-2 text-xs font-medium transition-transform active:scale-[0.98]">
          <Music2 className="size-4 text-primary" strokeWidth={1.8} /><span>♪ 今日一曲</span>
        </Link>
      </div>

      <section className="mt-8">
        <div className="mb-3">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">
            關於他 ♡
          </p>
          <h2 className="mt-1 font-display text-[18px] font-medium">想替他記住的事</h2>
        </div>

        <SoftCard className="px-5 py-2">
          <Row label="生日" value={idol.birthday} />
          <Row
            label="出道日期"
            value={
              idol.debutDate
                ? `${idol.debutDate}（${debut?.daysUntil === 0 ? "今天是出道紀念日" : `出道紀念日 ${debut?.ddayLabel}`}）`
                : ""
            }
          />
          <Row label="粉絲名稱" value={idol.fanName} />
          <Row label="我喜歡他的日期" value={idol.sinceDate} />
        </SoftCard>
      </section>

      {idol.birthday || idol.debutDate ? (
        <SoftCard className="mt-5 divide-y divide-border/50 overflow-hidden">
          {idol.birthday ? (
            <button
              type="button"
              onClick={() => setReminderKind("BIRTHDAY")}
              className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors active:bg-surface/70"
            >
              <Bell className="size-[18px] text-muted-foreground" strokeWidth={1.6} />
              <span className="flex-1 text-sm">替我記住他的生日</span>
              <span className="text-sm text-muted-foreground">
                {birthdayReminder ? formatDaysBefore(birthdayReminder.daysBefore) : "不提醒"}
              </span>
            </button>
          ) : null}
          {idol.debutDate ? (
            <button
              type="button"
              onClick={() => setReminderKind("ANNIVERSARY")}
              className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors active:bg-surface/70"
            >
              <Bell className="size-[18px] text-muted-foreground" strokeWidth={1.6} />
              <span className="flex-1 text-sm">替我記住出道紀念日</span>
              <span className="text-sm text-muted-foreground">
                {debutReminder ? formatDaysBefore(debutReminder.daysBefore) : "不提醒"}
              </span>
            </button>
          ) : null}
        </SoftCard>
      ) : null}

      <ReminderSheet
        open={reminderKind !== null}
        onOpenChange={(o) => {
          if (!o) setReminderKind(null);
        }}
        eventLabel={idol.name}
        eventTitle={reminderKind === "ANNIVERSARY" ? "出道紀念日" : "生日"}
        eventDate={(reminderKind === "ANNIVERSARY" ? idol.debutDate : idol.birthday) || ""}
        initialDaysBefore={
          reminderKind === "ANNIVERSARY"
            ? (debutReminder?.daysBefore ?? DEFAULT_DAYS_BEFORE)
            : (birthdayReminder?.daysBefore ?? DEFAULT_DAYS_BEFORE)
        }
        onSave={(daysBefore) => {
          if (!reminderKind) return;
          void setReminderFor({ type: reminderKind, idolId }, daysBefore);
          setReminderKind(null);
        }}
      />

      <IdolFormSheet
        open={editing}
        onOpenChange={setEditing}
        initial={draft}
        title="編輯偶像"
        submitLabel="儲存"
        onSubmit={handleSave}
        footer={
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="w-full rounded-full py-3 text-sm text-destructive transition-transform duration-300 active:scale-95"
          >
            刪除偶像
          </button>
        }
      />

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent className="max-w-[20rem] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>確定要移除這位偶像嗎？</AlertDialogTitle>
            <AlertDialogDescription>移除後目前的本地資料將會消失。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>確認移除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
