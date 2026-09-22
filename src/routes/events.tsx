import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarHeart, Plus, Package } from "lucide-react";
import { AppShell, EmptyState, PageHeader, SoftCard } from "@/components/AppShell";
import { EventFormSheet } from "@/components/EventFormSheet";
import {
  completedLine,
  eventCountdown,
  eventTypeMeta,
  sortEvents,
  type EventDraft,
  type IdolEvent,
} from "@/lib/events";
import type { Idol } from "@/lib/idols";
import { useIdolSource } from "@/lib/idols.source";
import { useEventSource } from "@/lib/events.source";
import { ReminderSheet } from "@/components/ReminderSheet";
import { EventDetailSheet } from "@/components/EventDetailSheet";
import { deleteMilestonesForEvent } from "@/lib/milestones";
import { DEFAULT_DAYS_BEFORE, formatReminderSummary } from "@/lib/reminders";
import { useReminderSource } from "@/lib/reminders.source";
import { scheduleEventNotifications } from "@/lib/event-notifications";
import { CloudRetryNotice } from "@/components/CloudRetryNotice";
import { useCollectionSource } from "@/lib/collection.source";
import { COLLECTION_PROVENANCE_OPTIONS, collectionCategoryMeta } from "@/lib/collection";

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
            <p className="truncate font-display text-[18px] font-medium">{event.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{c?.dotDate ?? event.date}</p>
          </div>
          {done ? (
            <p className="shrink-0 text-sm text-muted-foreground">{completedLine(event.type)}</p>
          ) : (
            <p className="font-display text-[26px] leading-none font-semibold text-primary">
              {c?.ddayLabel ?? "—"}
            </p>
          )}
        </div>
        <p className="mt-3 inline-flex rounded-full bg-surface px-3 py-1 text-[13px] tracking-wide text-muted-foreground">
          {meta.emoji} {meta.label}
        </p>
      </SoftCard>
    </button>
  );
}

function EventsPage() {
  const { idols, findIdol } = useIdolSource();
  const { events, ready, addEvent, updateEvent, removeEvent, error, reload } = useEventSource();
  const { items: collectionItems } = useCollectionSource();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IdolEvent | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const {
    reminders,
    remindersFor,
    reminderFor,
    setReminderFor,
    removeRemindersForEvent,
  } = useReminderSource();
  const activeReminderCount = reminders.filter((reminder) => reminder.enabled).length;


  const { upcoming, past } = useMemo(() => sortEvents(events), [events]);
  const detail = events.find((e) => e.id === detailId) ?? null;
  const idolOf = (id: string) => findIdol(id);

  const initial: EventDraft | undefined = editing
    ? {
        idolId: editing.idolId,
        title: editing.title,
        type: editing.type,
        date: editing.date,
        note: editing.note,
        locationName: editing.locationName ?? "",
        city: editing.city ?? "",
        weatherEnabled: Boolean(editing.weatherEnabled),
        weatherTone: editing.weatherTone ?? "SUNSHINE",
      }
    : undefined;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  async function handleSubmit(draft: EventDraft) {
    if (editing) await updateEvent(editing.id, draft);
    else await addEvent(draft);
    setFormOpen(false);
    setEditing(null);
  }

  const detailCountdown = detail ? eventCountdown(detail.date) : null;
  const detailCollection = detail ? collectionItems.filter((item) => item.eventId === detail.id) : [];

  return (
    <AppShell>
      <PageHeader
        title="我的日子"
        subtitle="把所有值得期待的日子，放在這裡。"
        action={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex shrink-0 items-center gap-1 min-h-11 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            新增日子
          </button>
        }
      />

      <div className="mb-5 flex gap-2 rounded-full bg-surface/70 p-1">
        <span className="flex-1 min-h-11 rounded-full bg-card py-2.5 text-center text-sm font-medium text-primary shadow-soft">
          倒數中的日子
        </span>
        <Link
          to="/calendar"
          className="flex-1 min-h-11 rounded-full py-2.5 text-center text-sm text-muted-foreground transition-transform duration-300 active:scale-95"
        >
          行事曆
        </Link>
      </div>

      {error ? (
        <CloudRetryNotice onRetry={reload}>
          目前連不上雲端資料，你的日子沒有遺失，請稍後再試。
        </CloudRetryNotice>
      ) : null}

      <div className="mb-5 rounded-2xl border border-border/60 bg-surface/50 px-4 py-4">
        <p className="text-sm font-medium">
          🔔 為你記住的日子 · {activeReminderCount} 個提醒
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          已儲存的提醒會在 App 與 iPhone 通知中使用。
        </p>
      </div>

      {!ready ? (
        <div className="h-40 rounded-2xl border border-border/60 bg-surface/40" aria-hidden />
      ) : events.length === 0 ? (
        <EmptyState
          icon={<CalendarHeart className="size-5" strokeWidth={1.6} />}
          title="還沒有在倒數的日子 👀"
          description="把下一個期待的日子先放進來吧。"
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
              <div className="flex items-center gap-3 pt-6 pb-1">
              <p className="text-[13px] font-semibold tracking-[0.12em] text-muted-foreground">
                ALREADY MET ♡
              </p>
              <span className="h-px flex-1 bg-border/60" />
            </div>
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
        <p className="mt-6 text-center text-sm text-muted-foreground">
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

      <EventDetailSheet
        event={detail}
        idol={detail ? idolOf(detail.idolId) : undefined}
        idolLabel={detail ? idolLabel(idolOf(detail.idolId)) : ""}
        open={Boolean(detail)}
        onOpenChange={(o: boolean) => {
          if (!o) setDetailId(null);
        }}
        onEdit={() => {
          if (!detail) return;
          setEditing(detail);
          setDetailId(null);
          setFormOpen(true);
        }}
        onRestore={async (date: string) => {
          if (!detail) return;
          await updateEvent(detail.id, {
            idolId: detail.idolId,
            title: detail.title,
            type: detail.type,
            date,
            note: detail.note,
          });
          setDetailId(null);
        }}
        onDelete={async () => {
          if (!detail) return;
          await removeEvent(detail.id);
          await removeRemindersForEvent(detail.id);
          deleteMilestonesForEvent(detail.id);
          setDetailId(null);
        }}
        reminderSummary={detail ? formatReminderSummary(remindersFor(detail.id)) : ""}
        onOpenReminder={() => setReminderOpen(true)}
      />


      {detail?.type === "CONCERT" ? (
        <section className="mt-5 rounded-[1.6rem] border border-primary/15 bg-primary/[0.05] px-5 py-5">
          <p className="text-[13px] font-semibold tracking-[0.14em] text-primary">THINGS I BROUGHT HOME ♡</p>
          <p className="mt-2 font-display text-[18px] font-medium">那天帶回家的東西</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">小卡、海報、票根、Tour Merch、VIP Gift，還有粉絲送你的飯制應援物，也都是這場演唱會留下來的回憶。</p>
          {detailCollection.length > 0 ? (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {detailCollection.slice(0,6).map((item) => {
                const meta = collectionCategoryMeta[item.category];
                const provenance = COLLECTION_PROVENANCE_OPTIONS.find((option) => option.value === (item.provenance || "UNSPECIFIED"));
                return <div key={item.id} className="w-[118px] shrink-0 overflow-hidden rounded-2xl bg-card shadow-soft">
                  {item.photo ? <img src={item.photo} alt="" className="aspect-square w-full object-cover"/> : <div className="flex aspect-square items-center justify-center bg-surface text-3xl">{meta.emoji}</div>}
                  <div className="px-3 py-2.5">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="mt-1 truncate text-[11px] text-muted-foreground">{item.provenance && item.provenance !== "UNSPECIFIED" ? `${provenance?.emoji || ""} ${provenance?.label || ""}` : meta.label}</p>
                  </div>
                </div>;
              })}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-card/70 px-4 py-3 text-sm text-muted-foreground">這場還沒有留下收藏。散場後拿到的小卡、手幅或票根，都可以從這裡收進來 ♡</p>
          )}
          {detailCollection.length > 0 ? <p className="mt-3 text-[13px] text-muted-foreground">這場已留下 {detailCollection.length} 件收藏 ♡</p> : null}
          <Link
            to="/collection"
            search={{ event: detail.id }}
            className="mt-4 flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]"
          >
            <Package className="size-4" strokeWidth={1.6} />
            看收藏／留下這場的收藏
          </Link>
        </section>
      ) : null}

      {detail ? (
        <ReminderSheet
          open={reminderOpen}
          onOpenChange={setReminderOpen}
          eventLabel={`${eventTypeMeta(detail.type).emoji} ${idolLabel(idolOf(detail.idolId))}`}
          eventTitle={detail.title}
          eventDate={eventCountdown(detail.date)?.dotDate ?? detail.date}
          initialDaysBefore={
            reminderFor({ type: "EVENT", eventId: detail.id })?.daysBefore ?? DEFAULT_DAYS_BEFORE
          }
          onSave={async (daysBefore) => {
            await setReminderFor({ type: "EVENT", eventId: detail.id }, daysBefore);
            await scheduleEventNotifications(detail, daysBefore);
            setReminderOpen(false);
          }}
        />
      ) : null}
    </AppShell>
  );
}
