import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AppShell, PageHeader, SoftCard } from "@/components/AppShell";
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
  type EventDraft,
  type EventType,
  type IdolEvent,
} from "@/lib/events";
import type { Idol } from "@/lib/idols";
import { useIdolSource } from "@/lib/idols.source";
import { useEventSource } from "@/lib/events.source";
import { parseLocalDate, today } from "@/lib/dates";
import { deleteReminders, formatDaysBefore, DEFAULT_DAYS_BEFORE } from "@/lib/reminders";
import { useReminderSource } from "@/lib/reminders.source";
import { ReminderSheet } from "@/components/ReminderSheet";
import { deleteMilestonesForEvent } from "@/lib/milestones";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "行事曆｜IdolDays" },
      {
        name: "description",
        content: "用一個月的視角，看看生日、演唱會與回歸，這個月有哪些值得期待的日子。",
      },
      { property: "og:title", content: "行事曆｜IdolDays" },
      { property: "og:description", content: "這個月有好多值得期待的日子。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalendarPage,
});

const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

/** Calendar 專用的小型 indicator（不修改 Event 資料結構） */
const INDICATOR: Record<EventType, string> = {
  BIRTHDAY: "🎂",
  CONCERT: "🎤",
  COMEBACK: "✨",
  TICKETING: "🎫",
  VOTING: "🗳️",
  MERCH: "🛍️",
  FAN_MEETING: "💗",
  TRAVEL: "✈️",
  SUPPORT: "🎁",
  CUSTOM: "♡",
};

const pad = (n: number) => String(n).padStart(2, "0");
const toKey = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

function idolLabel(idol?: Idol) {
  if (!idol) return "已刪除的偶像";
  return idol.groupName ? `${idol.groupName} · ${idol.name}` : idol.name;
}

/** Calendar 衍生資料：偶像生日／出道紀念日（不寫入 Event，也不改任何資料結構） */
type AnnKind = "birthday" | "debut";
type AnnItem = {
  id: string;
  kind: AnnKind;
  key: string;
  idol: Idol;
  day: number;
  /** 出道週年，無法計算時為 null */
  years: number | null;
};

const annEmoji = (kind: AnnKind) => (kind === "birthday" ? "🎂" : "✨");

function annTitle(item: AnnItem) {
  if (item.kind === "birthday") return `🎂 ${item.idol.name} 生日`;
  return item.years && item.years > 0
    ? `✨ ${item.idol.name} 出道 ${item.years} 週年`
    : `✨ ${item.idol.name} 出道紀念日`;
}

function CalendarPage() {
  const base = today();
  const { idols, findIdol } = useIdolSource();
  const { events, addEvent, updateEvent, removeEvent } = useEventSource();

  const [cursor, setCursor] = useState({ y: base.getFullYear(), m: base.getMonth() + 1 });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [annId, setAnnId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IdolEvent | null>(null);
  const [prefillDate, setPrefillDate] = useState("");
  const [reminderOpen, setReminderOpen] = useState(false);
  const { reminderFor, setReminderFor } = useReminderSource();

  const byDate = useMemo(() => {
    const map = new Map<string, IdolEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.createdAt - b.createdAt);
    return map;
  }, [events]);

  /** 目前月份的生日與出道紀念日（每年重複的月／日） */
  const monthAnniversaries = useMemo(() => {
    const list: AnnItem[] = [];
    for (const idol of idols) {
      const b = parseLocalDate(idol.birthday);
      if (b && b.m === cursor.m) {
        list.push({
          id: `birthday-${idol.id}`,
          kind: "birthday",
          key: toKey(cursor.y, cursor.m, b.d),
          idol,
          day: b.d,
          years: null,
        });
      }
      const d = parseLocalDate(idol.debutDate);
      if (d && d.m === cursor.m) {
        list.push({
          id: `debut-${idol.id}`,
          kind: "debut",
          key: toKey(cursor.y, cursor.m, d.d),
          idol,
          day: d.d,
          years: cursor.y - d.y,
        });
      }
    }
    return list.sort((a, b) =>
      a.day !== b.day ? a.day - b.day : a.kind === b.kind ? 0 : a.kind === "birthday" ? -1 : 1,
    );
  }, [idols, cursor]);

  const annByDate = useMemo(() => {
    const map = new Map<string, AnnItem[]>();
    for (const a of monthAnniversaries) {
      const list = map.get(a.key) ?? [];
      list.push(a);
      map.set(a.key, list);
    }
    return map;
  }, [monthAnniversaries]);

  const monthEvents = useMemo(() => {
    const prefix = `${cursor.y}-${pad(cursor.m)}-`;
    return events
      .filter((e) => e.date.startsWith(prefix))
      .sort((a, b) => (a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1));
  }, [events, cursor]);

  /** 本月值得期待：生日 → 出道紀念日 → Event，依日期排序 */
  const monthItems = useMemo(() => {
    const rank = (r: { kind: "event" | "ann"; ann?: AnnItem }) =>
      r.kind === "ann" ? (r.ann?.kind === "birthday" ? 0 : 1) : 2;
    const rows: Array<
      | { kind: "event"; date: string; event: IdolEvent }
      | { kind: "ann"; date: string; ann: AnnItem }
    > = [
      ...monthAnniversaries.map((a) => ({ kind: "ann" as const, date: a.key, ann: a })),
      ...monthEvents.map((e) => ({ kind: "event" as const, date: e.date, event: e })),
    ];
    return rows.sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return rank(a) - rank(b);
    });
  }, [monthAnniversaries, monthEvents]);


  const firstDay = new Date(cursor.y, cursor.m - 1, 1).getDay();
  const daysInMonth = new Date(cursor.y, cursor.m, 0).getDate();
  const cells = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const todayKey = toKey(base.getFullYear(), base.getMonth() + 1, base.getDate());

  function shiftMonth(delta: number) {
    setCursor((c) => {
      const next = new Date(c.y, c.m - 1 + delta, 1);
      return { y: next.getFullYear(), m: next.getMonth() + 1 };
    });
  }

  const idolOf = (id: string) => findIdol(id);
  const selectedEvents = selectedDate ? (byDate.get(selectedDate) ?? []) : [];
  const selectedAnns = selectedDate ? (annByDate.get(selectedDate) ?? []) : [];
  const detail = events.find((e) => e.id === detailId) ?? null;
  const detailCountdown = detail ? eventCountdown(detail.date, base) : null;
  const annDetail = annId ? (monthAnniversaries.find((a) => a.id === annId) ?? null) : null;

  /** 目前開啟的提醒目標（沿用既有 reminders，不建立新資料模型） */
  const reminderTarget = annDetail
    ? {
        type: annDetail.kind === "birthday" ? ("BIRTHDAY" as const) : ("ANNIVERSARY" as const),
        idolId: annDetail.idol.id,
      }
    : detail
      ? { type: "EVENT" as const, eventId: detail.id }
      : null;
  const currentReminder = reminderTarget ? reminderFor(reminderTarget) : undefined;
  const reminderLabel = currentReminder?.enabled
    ? `🔔 已設定提醒・${formatDaysBefore(currentReminder.daysBefore)}`
    : "🔔 設定提醒";

  function openDate(dateKey: string) {
    const list = byDate.get(dateKey) ?? [];
    const anns = annByDate.get(dateKey) ?? [];
    if (list.length === 0 && anns.length === 1 && anns[0]) {
      setAnnId(anns[0].id);
      return;
    }
    if (anns.length === 0 && list.length === 1 && list[0]) {
      setDetailId(list[0].id);
      return;
    }
    setSelectedDate(dateKey);
  }



  function openCreate(dateKey: string) {
    setSelectedDate(null);
    setEditing(null);
    setPrefillDate(dateKey);
    setFormOpen(true);
  }

  const initial: EventDraft | undefined = editing
    ? {
        idolId: editing.idolId,
        title: editing.title,
        type: editing.type,
        date: editing.date,
        note: editing.note,
      }
    : prefillDate
      ? { idolId: "", title: "", type: "CONCERT", date: prefillDate, note: "" }
      : undefined;

  async function handleSubmit(draft: EventDraft) {
    if (editing) await updateEvent(editing.id, draft);
    else await addEvent(draft);
    setFormOpen(false);
    setEditing(null);
    setPrefillDate("");
  }

  function selectedLabel(dateKey: string) {
    const p = parseLocalDate(dateKey);
    return p ? `${p.m} 月 ${p.d} 日` : dateKey;
  }

  return (
    <AppShell>
      <PageHeader title="行事曆" subtitle="這個月有好多值得期待的日子。" />

      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="上一個月"
          onClick={() => shiftMonth(-1)}
          className="flex size-9 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-transform duration-300 active:scale-90"
        >
          <ChevronLeft className="size-4" strokeWidth={1.8} />
        </button>
        <p className="font-display text-[19px] font-semibold">
          {cursor.y} 年 {cursor.m} 月
        </p>
        <button
          type="button"
          aria-label="下一個月"
          onClick={() => shiftMonth(1)}
          className="flex size-9 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-transform duration-300 active:scale-90"
        >
          <ChevronRight className="size-4" strokeWidth={1.8} />
        </button>
      </div>

      <SoftCard className="mb-8 px-3 py-5">
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {weekdays.map((w) => (
            <span key={w} className="pb-1 text-[11px] text-muted-foreground">
              {w}
            </span>
          ))}
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} className="h-12" />;
            const key = toKey(cursor.y, cursor.m, d);
            const list = byDate.get(key) ?? [];
            const anns = annByDate.get(key) ?? [];
            const marks = [
              ...anns.map((a) => ({ id: a.id, emoji: annEmoji(a.kind) })),
              ...list.map((e) => ({ id: e.id, emoji: INDICATOR[e.type] ?? "♡" })),
            ];
            const isToday = key === todayKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => openDate(key)}
                className="flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl transition-transform duration-300 active:scale-90"
              >
                <span
                  className={`flex size-7 items-center justify-center rounded-full text-sm ${
                    isToday
                      ? "bg-primary font-medium text-primary-foreground"
                      : "text-foreground/80"
                  }`}
                >
                  {d}
                </span>
                <span className="flex h-3 items-center gap-px text-[9px] leading-none">
                  {marks.slice(0, 2).map((m) => (
                    <span key={m.id}>{m.emoji}</span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </SoftCard>

      <section className="mb-8">
        <h2 className="mb-3 text-[15px] font-medium tracking-wide">本月值得期待</h2>

        {monthItems.length === 0 ? (
          <SoftCard className="px-6 py-10 text-center">
            <p className="text-[15px]">這個月還沒有值得倒數的日子。</p>
            <button
              type="button"
              onClick={() => openCreate(toKey(cursor.y, cursor.m, 1))}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
            >
              <Plus className="size-4" strokeWidth={2} />
              新增日子
            </button>
          </SoftCard>
        ) : (
          <div className="space-y-3">
            {monthItems.map((item) => {
              if (item.kind === "ann") {
                const a = item.ann;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAnnId(a.id)}
                    className="w-full text-left transition-transform duration-300 active:scale-[0.99]"
                  >
                    <SoftCard className="flex items-center gap-4 px-5 py-4">
                      <span className="w-12 shrink-0 text-sm text-muted-foreground">
                        {pad(cursor.m)}/{pad(a.day)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs text-muted-foreground">
                          {annEmoji(a.kind)} {idolLabel(a.idol)}
                        </span>
                        <span className="block truncate text-[15px]">{annTitle(a)}</span>
                      </span>
                      <span className="shrink-0 font-display text-[17px] leading-none font-semibold text-primary">
                        ♡
                      </span>
                    </SoftCard>
                  </button>
                );
              }
              const e = item.event;
              const c = eventCountdown(e.date, base);
              const done = c?.status === "COMPLETED";
              const meta = eventTypeMeta(e.type);
              const p = parseLocalDate(e.date);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setDetailId(e.id)}
                  className={`w-full text-left transition-transform duration-300 active:scale-[0.99] ${
                    done ? "opacity-55" : ""
                  }`}
                >
                  <SoftCard className="flex items-center gap-4 px-5 py-4">
                    <span className="w-12 shrink-0 text-sm text-muted-foreground">
                      {p ? `${pad(p.m)}/${pad(p.d)}` : e.date}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs text-muted-foreground">
                        {meta.emoji} {idolLabel(idolOf(e.idolId))}
                      </span>
                      <span className="block truncate text-[15px]">{e.title}</span>
                    </span>
                    <span
                      className={`shrink-0 font-display text-[17px] leading-none font-semibold ${
                        done ? "text-muted-foreground" : "text-primary"
                      }`}
                    >
                      {c?.ddayLabel ?? "—"}
                    </span>
                  </SoftCard>
                </button>
              );
            })}
          </div>
        )}
      </section>


      {/* 日期 Dialog：多個事件或沒有事件 */}
      <Dialog
        open={Boolean(selectedDate)}
        onOpenChange={(o) => {
          if (!o) setSelectedDate(null);
        }}
      >
        <DialogContent className="max-w-[22rem] rounded-3xl border-border/60 bg-card">
          {selectedDate ? (
            <>
              <DialogHeader className="items-center text-center">
                <DialogTitle className="text-[19px]">{selectedLabel(selectedDate)}</DialogTitle>
                <DialogDescription className="text-xs">
                  {selectedEvents.length > 0 || selectedAnns.length > 0
                    ? "這一天的日子"
                    : "這一天還沒有安排日子。"}
                </DialogDescription>
              </DialogHeader>

              {selectedAnns.length > 0 ? (
                <div className="space-y-2">
                  {selectedAnns.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setSelectedDate(null);
                        setAnnId(a.id);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl bg-surface/60 px-4 py-3 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs text-muted-foreground">
                          {annEmoji(a.kind)} {idolLabel(a.idol)}
                        </span>
                        <span className="block truncate text-[15px]">{annTitle(a)}</span>
                      </span>
                      <span className="font-display text-[15px] font-semibold text-primary">♡</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {selectedEvents.length > 0 ? (

                <div className="space-y-2">
                  {selectedEvents.map((e) => {
                    const c = eventCountdown(e.date, base);
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => {
                          setSelectedDate(null);
                          setDetailId(e.id);
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl bg-surface/60 px-4 py-3 text-left"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs text-muted-foreground">
                            {eventTypeMeta(e.type).emoji} {idolLabel(idolOf(e.idolId))}
                          </span>
                          <span className="block truncate text-[15px]">{e.title}</span>
                        </span>
                        <span
                          className={`font-display text-[15px] font-semibold ${
                            c?.status === "COMPLETED" ? "text-muted-foreground" : "text-primary"
                          }`}
                        >
                          {c?.ddayLabel ?? "—"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => openCreate(selectedDate)}
                className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
              >
                <Plus className="size-4" strokeWidth={2} />
                新增日子
              </button>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Event Detail */}
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

              {detail.note ? <p className="mt-1 text-[15px] leading-relaxed">{detail.note}</p> : null}

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
                        deleteReminders(detail.id);
                        deleteMilestonesForEvent(detail.id);
                        void removeEvent(detail.id);
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
                      setPrefillDate("");
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

      {/* 生日 Dialog（衍生顯示，不是 Event） */}
      <Dialog
        open={Boolean(birthdayDetail)}
        onOpenChange={(o) => {
          if (!o) setBirthdayIdolId(null);
        }}
      >
        <DialogContent className="max-w-[22rem] rounded-3xl border-border/60 bg-card text-center">
          {birthdayDetail ? (
            <>
              <DialogHeader className="items-center">
                <DialogDescription className="text-xs tracking-wide">
                  {idolLabel(birthdayDetail.idol)}
                </DialogDescription>
                <DialogTitle className="text-[19px]">
                  🎂 {birthdayDetail.idol.name} 的生日
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                {cursor.y} 年 {cursor.m} 月 {birthdayDetail.day} 日
              </p>
              <p className="mt-1 text-[15px] leading-relaxed">今天也一起陪他走過 ♡</p>
            </>
          ) : null}
        </DialogContent>
      </Dialog>


      <EventFormSheet
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) {
            setEditing(null);
            setPrefillDate("");
          }
        }}
        idols={idols}
        initial={initial}
        title={editing ? "編輯日子" : "新增日子"}
        submitLabel="儲存日子"
        onSubmit={handleSubmit}
      />
    </AppShell>
  );
}
