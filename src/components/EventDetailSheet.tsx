import { useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MilestoneFormSheet } from "@/components/MilestoneFormSheet";
import { eventCountdown, eventTypeMeta, type IdolEvent } from "@/lib/events";
import type { Idol } from "@/lib/idols";
import { daysSince, parseLocalDate, today } from "@/lib/dates";
import { useMilestones, type Milestone, type MilestoneDraft } from "@/lib/milestones";

/** 依倒數狀態選擇陪伴文案（App 的口吻，不是偶像本人發言） */
function companionLine(status: string, daysUntil: number | null) {
  if (status === "COMPLETED") return "好好收藏這份期待。";
  if (status === "TODAY") return "就是今天了 ♡";
  if (daysUntil !== null && daysUntil <= 3) return "再一下下，就要見面了 ♡";
  if (daysUntil !== null && daysUntil <= 30) return "距離那一天，又近了一點。";
  return "這一天正在慢慢靠近。";
}

function dotDate(date: string) {
  const p = parseLocalDate(date);
  if (!p) return date;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.y}.${pad(p.m)}.${pad(p.d)}`;
}

function shortDate(date: string) {
  const p = parseLocalDate(date);
  if (!p) return date;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(p.m)}.${pad(p.d)}`;
}

function IdolVisual({ idol }: { idol?: Idol | undefined }) {
  if (idol?.photo) {
    return (
      <img
        src={idol.photo}
        alt={idol.name}
        className="size-28 rounded-full object-cover shadow-soft"
      />
    );
  }
  return (
    <div className="flex size-28 items-center justify-center rounded-full bg-surface text-2xl text-muted-foreground shadow-soft">
      {idol?.name?.slice(0, 1) ?? "♡"}
    </div>
  );
}

function MilestoneRow({
  milestone,
  last,
  onToggle,
  onEdit,
  onDelete,
}: {
  milestone: Milestone;
  last: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const done = milestone.completed;
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!last ? (
        <span className="absolute top-5 bottom-0 left-[7px] w-px bg-border" aria-hidden />
      ) : null}
      <button
        type="button"
        aria-pressed={done}
        aria-label={done ? "標記為未完成" : "標記為完成"}
        onClick={onToggle}
        className={`relative z-10 mt-1.5 size-[15px] shrink-0 rounded-full border-2 transition-colors ${
          done ? "border-primary bg-primary" : "border-border bg-background"
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{shortDate(milestone.date)}</p>
        <p className={`text-[15px] ${done ? "text-muted-foreground line-through" : ""}`}>
          {milestone.emoji} {milestone.title}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="更多"
          className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground"
        >
          <MoreHorizontal className="size-4" strokeWidth={1.8} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-2xl">
          <DropdownMenuItem onSelect={onEdit}>編輯</DropdownMenuItem>
          <DropdownMenuItem onSelect={onDelete} className="text-destructive">
            刪除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

export function EventDetailSheet({
  event,
  idol,
  idolLabel,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  reminderSummary,
  onOpenReminder,
}: {
  event: IdolEvent | null;
  idol?: Idol | undefined;
  idolLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  reminderSummary?: string;
  onOpenReminder?: () => void;
}) {
  const base = today();
  const { milestones, addMilestone, updateMilestone, toggleMilestone, removeMilestone } =
    useMilestones(event?.id);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!event) return null;

  const c = eventCountdown(event.date, base);
  const meta = eventTypeMeta(event.type);
  const since = idol ? daysSince(idol.sinceDate, base) : null;

  function submitMilestone(draft: MilestoneDraft) {
    if (!event) return;
    if (editingMilestone) updateMilestone(editingMilestone.id, draft);
    else addMilestone(event.id, draft);
    setFormOpen(false);
    setEditingMilestone(null);
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="mx-auto h-[94vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-border/60 bg-background px-6 pb-[max(2rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{event.title}</SheetTitle>
            <SheetDescription>這一天的倒數與里程碑</SheetDescription>
          </SheetHeader>

          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="更多"
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground"
              >
                <MoreHorizontal className="size-5" strokeWidth={1.8} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl">
                <DropdownMenuItem onSelect={onEdit}>編輯日子</DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setConfirmDelete(true)}
                  className="text-destructive"
                >
                  刪除日子
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Hero */}
          <div className="flex flex-col items-center text-center">
            <IdolVisual idol={idol} />
            <p className="mt-4 text-sm tracking-wide text-muted-foreground">{idolLabel}</p>
            <p className="mt-5 rounded-full bg-surface/70 px-5 py-2 text-[13px] text-surface-foreground">
              {companionLine(c?.status ?? "UPCOMING", c?.daysUntil ?? null)}
            </p>
          </div>

          {/* Countdown */}
          <div className="mt-10 text-center">
            <p className="text-xs tracking-widest text-muted-foreground">
              {c?.status === "COMPLETED" ? "那一天是" : `距離 ${c?.dotDate ?? event.date}`}
            </p>
            {c?.status === "COMPLETED" ? (
              <p className="mt-3 font-display text-[40px] leading-none font-semibold text-muted-foreground">
                已結束
              </p>
            ) : c?.status === "TODAY" ? (
              <p className="mt-3 font-display text-[56px] leading-none font-semibold text-primary">
                D-DAY
              </p>
            ) : (
              <>
                <p className="mt-2 font-display text-[92px] leading-none font-semibold text-primary">
                  {c?.daysUntil}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">天・{c?.ddayLabel}</p>
              </>
            )}

            <p className="mt-8 font-display text-[22px] font-semibold">
              {meta.emoji} {event.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {meta.label}・{dotDate(event.date)}
            </p>
          </div>

          {/* Companion */}
          {since && !since.isFuture ? (
            <div className="mt-10 border-y border-border/60 py-6 text-center">
              <p className="text-xs tracking-widest text-muted-foreground">陪你走過</p>
              <p className="mt-1 font-display text-[40px] leading-none font-semibold">
                {since.days}
                <span className="ml-1 text-sm font-normal text-muted-foreground">天</span>
              </p>
            </div>
          ) : null}

          {/* Note */}
          {event.note ? (
            <div className="mt-8">
              <p className="text-xs tracking-widest text-muted-foreground">我的備註</p>
              <p className="mt-2 text-[15px] leading-relaxed">{event.note}</p>
            </div>
          ) : null}

          {/* Reminder（S2-C Reminder 已建立時顯示入口） */}
          {reminderSummary ? (
            <div className="mt-8 flex items-center justify-between gap-3 rounded-2xl bg-surface/60 px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs tracking-wide text-muted-foreground">🔔 提醒</p>
                <p className="mt-0.5 truncate text-sm">{reminderSummary}</p>
              </div>
              {onOpenReminder ? (
                <button
                  type="button"
                  onClick={onOpenReminder}
                  className="shrink-0 text-xs text-primary underline underline-offset-4"
                >
                  設定提醒
                </button>
              ) : null}
            </div>
          ) : null}

          {/* Milestones */}
          <div className="mt-10">
            <h3 className="font-display text-[17px] font-semibold">里程碑</h3>
            <p className="mt-1 text-xs text-muted-foreground">為這一天留下幾個小小的節點。</p>

            {milestones.length === 0 ? (
              <div className="mt-6 text-center">
                <p className="text-[15px]">還沒有里程碑</p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  把準備這一天的每一個小瞬間留下來。
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMilestone(null);
                    setFormOpen(true);
                  }}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
                >
                  <Plus className="size-4" strokeWidth={2} />
                  新增第一個里程碑
                </button>
              </div>
            ) : (
              <>
                <ul className="mt-6">
                  {milestones.map((m, i) => (
                    <MilestoneRow
                      key={m.id}
                      milestone={m}
                      last={i === milestones.length - 1}
                      onToggle={() => toggleMilestone(m.id)}
                      onEdit={() => {
                        setEditingMilestone(m);
                        setFormOpen(true);
                      }}
                      onDelete={() => removeMilestone(m.id)}
                    />
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMilestone(null);
                    setFormOpen(true);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary"
                >
                  <Plus className="size-4" strokeWidth={2} />
                  新增里程碑
                </button>
              </>
            )}
          </div>

          {confirmDelete ? (
            <div className="mt-10 rounded-2xl bg-surface/60 px-5 py-5 text-center">
              <p className="text-sm">確定要刪除這個日子嗎？</p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-full border border-border/70 py-2.5 text-sm"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDelete(false);
                    onDelete();
                  }}
                  className="flex-1 rounded-full bg-destructive py-2.5 text-sm text-destructive-foreground"
                >
                  刪除
                </button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <MilestoneFormSheet
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditingMilestone(null);
        }}
        initial={
          editingMilestone
            ? {
                title: editingMilestone.title,
                date: editingMilestone.date,
                emoji: editingMilestone.emoji,
              }
            : undefined
        }
        defaultDate={event.date}
        title={editingMilestone ? "編輯里程碑" : "新增里程碑"}
        submitLabel="儲存里程碑"
        onSubmit={submitMilestone}
      />
    </>
  );
}
