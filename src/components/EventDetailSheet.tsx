import { StoredImage } from "@/components/StoredImage";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MoreHorizontal, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MilestoneFormSheet } from "@/components/MilestoneFormSheet";
import { Paywall } from "@/components/Paywall";
import { useSubscription } from "@/lib/subscription";
import { canUseFanWeather, completedLine, eventCountdown, eventTypeMeta, type IdolEvent } from "@/lib/events";
import type { Idol } from "@/lib/idols";
import { daysSince, parseLocalDate, today } from "@/lib/dates";
import { type Milestone, type MilestoneDraft } from "@/lib/milestones";
import { useMilestoneSource } from "@/lib/milestones.source";

/** 依倒數狀態選擇陪伴文案（App 的口吻，不是偶像本人發言） */
function companionLine(status: string, daysUntil: number | null) {
  if (status === "COMPLETED") return "已經見過啦 🥹 這一天先好好收藏起來 ♡";
  if (status === "TODAY") return "今天見！！！！😭";
  if (daysUntil !== null && daysUntil <= 3) return "救命，剩沒幾天了ㅠㅠ";
  if (daysUntil !== null && daysUntil <= 30) return "又更近了一點，開始期待了 🥹";
  return "還有一段路，但我等得起 👀";
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
      <StoredImage
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
  onDelete: () => void | Promise<void>;
}) {
  const done = milestone.completed;
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {!last ? (
        <span className="absolute top-10 -bottom-1 left-[19px] w-0.5 bg-gradient-to-b from-primary/55 to-primary/15" aria-hidden />
      ) : null}
      <button
        type="button"
        aria-pressed={done}
        aria-label={done ? "標記為未完成" : "標記為完成"}
        onClick={onToggle}
        className={`relative z-10 mt-3 flex size-10 shrink-0 items-center justify-center rounded-full border transition-all ${
          done
            ? "border-primary bg-primary text-primary-foreground shadow-[0_5px_14px_rgba(233,139,170,0.3)]"
            : "border-primary/35 bg-card text-primary"
        }`}
      >
        <span className="text-base" aria-hidden>{done ? "✓" : milestone.emoji}</span>
      </button>
      <div className="min-w-0 flex-1 rounded-2xl border border-border/70 bg-card/90 px-4 py-3 text-card-foreground shadow-soft">
        <p className="text-xs font-medium text-primary">{shortDate(milestone.date)}</p>
        <p className={`text-[15px] ${done ? "text-muted-foreground line-through" : ""}`}>
          {milestone.title}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">{done ? "已完成，這一步也收藏好了 ♡" : "點左側圖示標記完成"}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="更多"
          className="mt-2 flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground shadow-soft"
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
  onRestore,
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
  onRestore?: (date: string) => void;
  reminderSummary?: string;
  onOpenReminder?: () => void;
}) {
  const base = today();
  const { milestones, addMilestone, updateMilestone, toggleMilestone, removeMilestone } =
    useMilestoneSource(event?.id);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [restoreDate, setRestoreDate] = useState("");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const { isPlus } = useSubscription();

  if (!event) return null;

  const c = eventCountdown(event.date, base);
  const meta = eventTypeMeta(event.type);
  const since = idol ? daysSince(idol.sinceDate, base) : null;
  const fanWeatherReady = canUseFanWeather(event);

  function submitMilestone(draft: MilestoneDraft) {
    if (!event) return;
    if (editingMilestone) void updateMilestone(editingMilestone.id, draft);
    else void addMilestone(event.id, draft);
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
                {c?.status === "COMPLETED" && onRestore ? (
                  <DropdownMenuItem
                    onSelect={() => {
                      setRestoreDate("");
                      setConfirmRestore(true);
                    }}
                  >
                    ↩️ 移回進行中
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  onSelect={() => {
                    setDeleteError("");
                    setConfirmDelete(true);
                  }}
                  className="text-destructive"
                >
                  刪除日子
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Photo, then separate D-Day cards — never cover the idol */}
          <section className="mt-1">
            <div className="relative h-[300px] overflow-hidden bg-gradient-to-b from-[#eec9df] via-[#f8dce8] to-[#fdeef2]">
              {idol?.photo ? (
                <StoredImage
                  src={idol.photo}
                  alt={idol.name}
                  className="absolute inset-0 size-full object-contain object-center"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-sm text-muted-foreground">{idolLabel}</div>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#fdeef2]/80 to-transparent" />
              <span className="absolute left-6 top-8 text-xl text-white/75">✧</span>
              <span className="absolute right-8 top-16 text-2xl text-white/70">✦</span>
            </div>

            <div className="mt-4 rounded-[1.45rem] border border-border/70 bg-card px-4 py-3 text-center text-card-foreground shadow-[0_12px_28px_rgba(126,74,96,0.13)]">
              <p className="font-display text-[18px] font-semibold">{event.title}</p>
              <p className="mt-1 text-[10px] font-medium tracking-[0.12em] text-primary uppercase">{meta.label}</p>
              {c?.status === "COMPLETED" ? (
                <p className="mt-2 font-display text-[24px] leading-none text-muted-foreground">{completedLine(event.type)}</p>
              ) : c?.status === "TODAY" ? (
                <p className="mt-2 font-display text-[42px] leading-none text-primary">D-DAY</p>
              ) : (
                <p className="mt-1 font-display text-[45px] leading-none text-primary">D - {c?.daysUntil ?? 0}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">{dotDate(event.date)}</p>
            </div>

            {since && !since.isFuture && since.days !== null ? (
              <div className="mt-3 rounded-[1.45rem] border border-border/70 bg-card px-5 py-3 text-center text-card-foreground shadow-[0_10px_24px_rgba(126,74,96,0.10)]">
                <p className="text-[11px] font-medium text-muted-foreground">陪伴總走過</p>
                <p className="mt-0.5 font-display text-[30px] leading-none text-foreground">
                  {since.days}<span className="ml-1 text-sm">天</span>
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{companionLine(c?.status ?? "UPCOMING", c?.daysUntil ?? null)}</p>
              </div>
            ) : null}
          </section>

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
                  幫我記住 ♡
                </button>
              ) : null}
            </div>
          ) : null}

          {/* Fan Weather — IdolDays+ preview */}
          <div className="mt-4 rounded-2xl border border-border/60 bg-surface/40 px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">
                    ☁️ 追星天氣
                  </p>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">
                    IdolDays+
                  </span>
                </div>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  根據活動地點與真實天氣，自動準備你的追星提醒。
                </p>
              </div>

              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                isPlus ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}>
                {isPlus ? "已開啟" : "🔒"}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-card px-3 py-1.5 text-[11px]">
                🌧️ 雨天準備
              </span>
              <span className="rounded-full bg-card px-3 py-1.5 text-[11px]">
                ❄️ 保暖
              </span>
              <span className="rounded-full bg-card px-3 py-1.5 text-[11px]">
                ☀️ 防曬補水
              </span>
              
            </div>

            {isPlus && fanWeatherReady ? (
              <Link
                to="/weather/$eventId"
                params={{ eventId: event.id }}
                className="mt-3 block w-full rounded-xl bg-primary px-3 py-2.5 text-center text-xs font-medium text-primary-foreground shadow-soft"
              >
                查看天氣與提醒
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (isPlus) onEdit();
                  else setPaywallOpen(true);
                }}
                className="mt-3 w-full rounded-xl bg-primary px-3 py-2.5 text-center text-xs font-medium text-primary-foreground shadow-soft transition-transform active:scale-95"
              >
                {isPlus ? "設定追星天氣" : "立即訂閱"}
              </button>
            )}
          </div>

          {/* Milestones */}
          <div className="mt-10 rounded-[1.9rem] border border-border/60 bg-card/65 px-5 py-6 text-card-foreground shadow-soft">
            <h3 className="font-display text-[17px] font-semibold">里程碑</h3>
            <p className="mt-1 text-xs text-muted-foreground">為這一天留下幾個小小的節點。</p>

            {milestones.length === 0 ? (
              <div className="mt-6 text-center">
                <p className="text-[15px]">這天還沒留下什麼紀錄 👀</p>
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
                <ul className="mt-6 rounded-[1.75rem] border border-border/60 bg-surface/35 p-4">
                  {milestones.map((m, i) => (
                    <MilestoneRow
                      key={m.id}
                      milestone={m}
                      last={i === milestones.length - 1}
                      onToggle={() => void toggleMilestone(m.id)}
                      onEdit={() => {
                        setEditingMilestone(m);
                        setFormOpen(true);
                      }}
                      onDelete={() => void removeMilestone(m.id)}
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

          {confirmRestore && onRestore ? (
            <div className="mt-10 rounded-2xl bg-surface/60 px-5 py-5">
              <p className="text-center text-sm">要把這一天重新放回倒數嗎？</p>
              <p className="mt-1.5 text-center text-xs text-muted-foreground">
                移回去之後，它會再次出現在進行中的日子裡。
              </p>
              <label className="mt-4 block text-xs text-muted-foreground">
                想把它重新倒數到哪一天？
                <input
                  type="date"
                  value={restoreDate}
                  onChange={(e) => setRestoreDate(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-border/70 bg-background px-4 py-2.5 text-sm text-foreground"
                />
              </label>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmRestore(false)}
                  className="flex-1 rounded-full border border-border/70 py-2.5 text-sm"
                >
                  先不要
                </button>
                <button
                  type="button"
                  disabled={!restoreDate}
                  onClick={() => {
                    setConfirmRestore(false);
                    onRestore(restoreDate);
                  }}
                  className="flex-1 rounded-full bg-primary py-2.5 text-sm text-primary-foreground disabled:opacity-50"
                >
                  移回進行中
                </button>
              </div>
            </div>
          ) : null}

          {confirmDelete ? (
            <div className="mt-10 rounded-2xl bg-surface/60 px-5 py-5 text-center">
              <p className="text-sm">確定要刪除這個日子嗎？</p>
              {deleteError ? <p className="mt-2 text-xs text-destructive">{deleteError}</p> : null}
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-full border border-border/70 py-2.5 text-sm disabled:opacity-60"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={async () => {
                    if (deleting) return;
                    setDeleting(true);
                    setDeleteError("");
                    try {
                      await onDelete();
                      setConfirmDelete(false);
                    } catch {
                      setDeleteError("這個日子沒有刪除成功，請確認網路後再試一次");
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  className="flex-1 rounded-full bg-destructive py-2.5 text-sm text-destructive-foreground disabled:opacity-60"
                >
                  {deleting ? "刪除中…" : "刪除"}
                </button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Paywall
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        feature="CUSTOM_REMINDER"
      />

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
