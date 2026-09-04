import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarHeart, Plus } from "lucide-react";
import { AppShell, EmptyState, PageHeader, SoftCard } from "@/components/AppShell";
import { EventFormSheet } from "@/components/EventFormSheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  eventCountdown,
  eventTypeMeta,
  sortEvents,
  useEvents,
  type EventDraft,
  type IdolEvent,
} from "@/lib/events";
import { useIdols, type Idol } from "@/lib/idols";
import { ReminderSheet } from "@/components/ReminderSheet";
import {
  deleteReminders,
  formatReminderSummary,
  saveReminders,
  useReminders,
} from "@/lib/reminders";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "我的日子｜IdolDays" },
      {
        name: "description",
        content: "把演唱會、回歸、搶票與生日，所有值得期待的追星日子放在同一個地方倒數。",
      },
      { property: "og:title", content: "我的日子｜IdolDays" },
      { property: "og:description", content: "把所有值得期待的日子，放在這裡。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsPage,
});

function idolLabel(idol?: Idol) {
  if (!idol) return "已刪除的偶像";
  return idol.groupName ? `${idol.groupName} · ${idol.name}` : idol.name;
}

function EventCard({
  event,
  idol,
  onOpen,
}: {
  event: IdolEvent;
  idol?: Idol | undefined;
  onOpen: () => void;
}) {
  const c = eventCountdown(event.date);
  const meta = eventTypeMeta(event.type);
  const done = c?.status === "COMPLETED";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full text-left transition-transform duration-300 active:scale-[0.99] ${done ? "opacity-60" : ""}`}
    >
      <SoftCard className="px-5 py-5">
        <p className="text-xs tracking-wide text-muted-foreground">{idolLabel(idol)}</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-[17px]">{event.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{c?.dotDate ?? event.date}</p>
          </div>
          <p
            className={`font-display text-[26px] leading-none font-semibold ${
              done ? "text-muted-foreground" : "text-primary"
            }`}
          >
            {c?.ddayLabel ?? "—"}
          </p>
        </div>
        <p className="mt-3 inline-flex rounded-full bg-surface px-3 py-1 text-[11px] tracking-wide text-muted-foreground">
          {meta.emoji} {meta.label}
        </p>
      </SoftCard>
    </button>
  );
}

function EventsPage() {
  const { idols } = useIdols();
  const { events, ready, addEvent, updateEvent, removeEvent } = useEvents();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IdolEvent | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const { remindersFor } = useReminders();


  const { upcoming, past } = useMemo(() => sortEvents(events), [events]);
  const detail = events.find((e) => e.id === detailId) ?? null;
  const idolOf = (id: string) => idols.find((i) => i.id === id);

  const initial: EventDraft | undefined = editing
    ? {
        idolId: editing.idolId,
        title: editing.title,
        type: editing.type,
        date: editing.date,
        note: editing.note,
      }
    : undefined;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function handleSubmit(draft: EventDraft) {
    if (editing) updateEvent(editing.id, draft);
    else addEvent(draft);
    setFormOpen(false);
    setEditing(null);
  }

  const detailCountdown = detail ? eventCountdown(detail.date) : null;

  return (
    <AppShell>
      <PageHeader
        title="我的日子"
        subtitle="把所有值得期待的日子，放在這裡。"
        action={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            新增日子
          </button>
        }
      />

      {!ready ? (
        <div className="h-40 rounded-2xl border border-border/60 bg-surface/40" aria-hidden />
      ) : events.length === 0 ? (
        <EmptyState
          icon={<CalendarHeart className="size-5" strokeWidth={1.6} />}
          title="還沒有值得倒數的日子"
          description="把下一個期待的日子放進來吧。"
          action={
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
            >
              <Plus className="size-4" strokeWidth={2} />
              新增第一個日子
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {upcoming.map((e) => (
            <EventCard key={e.id} event={e} idol={idolOf(e.idolId)} onOpen={() => setDetailId(e.id)} />
          ))}

          {past.length > 0 ? (
            <>
              <p className="pt-4 pb-1 text-xs tracking-wide text-muted-foreground">已經走過的日子</p>
              {past.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  idol={idolOf(e.idolId)}
                  onOpen={() => setDetailId(e.id)}
                />
              ))}
            </>
          ) : null}
        </div>
      )}

      {idols.length === 0 && events.length > 0 ? (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/idols" className="underline underline-offset-4">
            前往我的偶像
          </Link>
        </p>
      ) : null}

      <EventFormSheet
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        idols={idols}
        initial={initial}
        title={editing ? "編輯日子" : "新增日子"}
        submitLabel="儲存日子"
        onSubmit={handleSubmit}
      />

      <Dialog
        open={Boolean(detail)}
        onOpenChange={(o) => {
          if (!o) {
            setDetailId(null);
            setConfirmDelete(false);
          }
        }}
      >
        <DialogContent className="max-w-[22rem] rounded-3xl border-border/60 bg-card text-center">
          {detail ? (
            <>
              <DialogHeader className="items-center">
                <DialogDescription className="text-xs tracking-wide">
                  {idolLabel(idolOf(detail.idolId))}
                </DialogDescription>
                <DialogTitle className="text-[19px]">{detail.title}</DialogTitle>
              </DialogHeader>

              <p className="font-display text-[52px] leading-none font-semibold text-primary">
                {detailCountdown?.ddayLabel ?? "—"}
              </p>
              <p className="text-sm text-muted-foreground">{detailCountdown?.fullDate}</p>
              <p className="text-[11px] tracking-wide text-muted-foreground">
                {eventTypeMeta(detail.type).emoji} {eventTypeMeta(detail.type).label}
              </p>

              {detail.note ? (
                <p className="mt-1 text-[15px] leading-relaxed">{detail.note}</p>
              ) : null}

              {confirmDelete ? (
                <div className="mt-3">
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
                        removeEvent(detail.id);
                        setConfirmDelete(false);
                        setDetailId(null);
                      }}
                      className="flex-1 rounded-full bg-destructive py-2.5 text-sm text-destructive-foreground"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(detail);
                      setDetailId(null);
                      setFormOpen(true);
                    }}
                    className="flex-1 rounded-full border border-border/70 py-2.5 text-sm transition-transform duration-300 active:scale-95"
                  >
                    編輯
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="flex-1 rounded-full border border-border/70 py-2.5 text-sm text-destructive transition-transform duration-300 active:scale-95"
                  >
                    刪除
                  </button>
                </div>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
