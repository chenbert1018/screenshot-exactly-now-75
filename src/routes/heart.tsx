import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Plus, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { AppShell, EmptyState, SoftCard } from "@/components/AppShell";
import { HeartFormSheet } from "@/components/HeartFormSheet";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import {
  heartTypeLabel,
  heartWhisper,
  HEART_TYPES,
  useHeartItems,
  type HeartDraft,
  type HeartItem,
  type HeartItemType,
} from "@/lib/heart";
import { type Idol } from "@/lib/idols";
import { useIdolSource } from "@/lib/idols.source";
import { useSugarSource } from "@/lib/sugar.source";
import { parseLocalDate } from "@/lib/dates";
import { StoredImage } from "@/components/StoredImage";

export const Route = createFileRoute("/heart")({
  head: () => ({
    meta: [
      { title: "嗑糖考古｜IdolDays" },
      { name: "description", content: "把那些讓你嗑到的瞬間，一一收藏起來。" },
      { property: "og:title", content: "嗑糖考古｜IdolDays" },
      { property: "og:description", content: "收藏那些讓我嗑到的瞬間。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HeartPage,
});

const pad = (n: number) => String(n).padStart(2, "0");

/** 2026.09.04 */
function dotDate(value: string) {
  const p = parseLocalDate(value);
  if (!p) return "";
  return `${p.y}.${pad(p.m)}.${pad(p.d)}`;
}

/** 09.04 */
function shortDate(value: string) {
  const p = parseLocalDate(value);
  if (!p) return "";
  return `${pad(p.m)}.${pad(p.d)}`;
}

function toDraft(item: HeartItem): HeartDraft {
  return {
    idolId: item.idolId,
    title: item.title,
    date: item.date,
    type: item.type,
    note: item.note ?? "",
    image: item.image ?? "",
    link: item.link ?? "",
  };
}

function Placeholder({ item, name }: { item: HeartItem; name: string }) {
  return (
    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-surface/60">
      <span className="flex size-12 items-center justify-center rounded-full bg-accent/50 font-display text-lg text-primary">
        {name.slice(0, 1) || "♡"}
      </span>
      <span className="text-xs tracking-[0.2em] text-muted-foreground">
        {heartTypeLabel(item.type)}
      </span>
    </div>
  );
}

function HeartCard({
  item,
  idolName,
  onOpen,
}: {
  item: HeartItem;
  idolName: string;
  onOpen: () => void;
}) {
  return (
    <button type="button" onClick={onOpen} className="w-full text-left">
      <SoftCard className="overflow-hidden p-0 transition-transform duration-300 active:scale-[0.98]">
        {item.image ? (
          <StoredImage src={item.image} alt={item.title} className="aspect-[4/3] w-full object-cover" />
        ) : (
          <Placeholder item={item} name={idolName} />
        )}
        <div className="px-4 py-4">
          <p className="text-primary" aria-hidden>
            ♡
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {idolName}・{dotDate(item.date)}
          </p>
          <span className="mt-2 inline-flex rounded-full bg-surface px-2.5 py-1 text-[11px] text-muted-foreground">
            {heartTypeLabel(item.type)}
          </span>
          <p className="mt-2 font-display text-[16px] leading-snug">{item.title}</p>
        </div>
      </SoftCard>
    </button>
  );
}

function HeartDetailSheet({
  item,
  idolName,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  item: HeartItem | null;
  idolName: string;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Sheet open={!!item} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92vh] w-full max-w-md overflow-x-hidden overflow-y-auto rounded-t-3xl border-border/60 bg-card px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        {item ? (
          <>
            <SheetHeader className="px-0 text-left">
              <SheetTitle className="sr-only">{item.title}</SheetTitle>
              <SheetDescription className="sr-only">嗑糖瞬間的細節</SheetDescription>
            </SheetHeader>

            <div className="overflow-hidden rounded-2xl border border-border/60">
              {item.image ? (
                <StoredImage src={item.image} alt={item.title} className="aspect-[4/3] w-full object-cover" />
              ) : (
                <Placeholder item={item} name={idolName} />
              )}
            </div>

            <p className="mt-5 text-xs text-muted-foreground">
              {idolName}・{dotDate(item.date)}・{heartTypeLabel(item.type)}
            </p>
            <h2 className="mt-2 font-display text-[22px] leading-snug">{item.title}</h2>

            {item.note ? (
              <p className="mt-4 rounded-2xl bg-surface/60 px-4 py-4 text-sm leading-relaxed whitespace-pre-wrap">
                {item.note}
              </p>
            ) : null}

            {item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center gap-2 rounded-2xl border border-border/60 px-4 py-3 text-sm break-all text-primary"
              >
                <ExternalLink className="size-4 shrink-0" strokeWidth={1.6} />
                {item.link}
              </a>
            ) : null}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onEdit}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border/70 py-3 text-sm transition-transform duration-300 active:scale-95"
              >
                <Pencil className="size-4" strokeWidth={1.6} />
                編輯
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-destructive/30 py-3 text-sm text-destructive transition-transform duration-300 active:scale-95"
              >
                <Trash2 className="size-4" strokeWidth={1.6} />
                刪除
              </button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function HeartPage() {
  const { idols, ready: idolsReady } = useIdolSource();
  const { items, ready, add, update, remove, error } = useSugarSource();

  const [idolFilter, setIdolFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | HeartItemType>("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HeartItem | null>(null);
  const [detail, setDetail] = useState<HeartItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<HeartItem | null>(null);

  const idolName = (id: string) => idols.find((i) => i.id === id)?.name || "已刪除的偶像";

  const filtered = useMemo(
    () =>
      items
        .filter((i) => (idolFilter === "ALL" ? true : i.idolId === idolFilter))
        .filter((i) => (typeFilter === "ALL" ? true : i.type === typeFilter)),
    [items, idolFilter, typeFilter],
  );

  const groups = useMemo(() => {
    const map = new Map<string, Map<string, HeartItem[]>>();
    for (const item of filtered) {
      const p = parseLocalDate(item.date);
      if (!p) continue;
      const year = String(p.y);
      const month = pad(p.m);
      if (!map.has(year)) map.set(year, new Map());
      const months = map.get(year)!;
      if (!months.has(month)) months.set(month, []);
      months.get(month)!.push(item);
    }
    return [...map.entries()].map(([year, months]) => ({
      year,
      months: [...months.entries()].map(([month, list]) => ({ month, list })),
    }));
  }, [filtered]);

  const selectedIdol: Idol | undefined =
    idolFilter === "ALL" ? undefined : idols.find((i) => i.id === idolFilter);

  const countText = selectedIdol
    ? `和 ${selectedIdol.name} 一起收藏了 ${filtered.length} 顆糖`
    : `已收藏 ${filtered.length} 顆糖`;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function submit(draft: HeartDraft) {
    if (editing) void update(editing.id, draft);
    else void add(draft);
    setFormOpen(false);
    setEditing(null);
    setDetail(null);
  }

  return (
    <AppShell>
      <header className="mb-7">
        <p className="text-[11px] tracking-[0.28em] text-muted-foreground uppercase">
          My Heart Archive
        </p>
        <h1 className="mt-2 font-display text-[28px] leading-tight font-medium">
          🍬 嗑糖考古
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          收藏那些讓我嗑到的瞬間。
        </p>
      </header>

      {error ? (
        <p className="mb-4 rounded-2xl border border-border/60 bg-surface/60 px-4 py-3 text-sm text-muted-foreground">
          目前連不上雲端資料，你收藏的糖沒有遺失，請稍後再試。
        </p>
      ) : null}

      {!ready || !idolsReady ? (

        <div className="h-60 rounded-3xl border border-border/60 bg-surface/40" aria-hidden />
      ) : idols.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-5" strokeWidth={1.6} />}
          title="先建立一位偶像，再開始收藏糖吧 ♡"
          action={
            <Link
              to="/idols"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
            >
              <Plus className="size-4" strokeWidth={2} />
              新增偶像
            </Link>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-5" strokeWidth={1.6} />}
          title="這裡還是空的。"
          description="從第一顆糖開始收藏吧 ♡"
          action={
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
            >
              <Plus className="size-4" strokeWidth={2} />
              收藏第一顆糖
            </button>
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{countText}</p>
          <p className="mt-1.5 text-sm leading-relaxed">{heartWhisper()}</p>

          {idols.length > 1 ? (
            <div className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1">
              {[{ id: "ALL", name: "全部" }, ...idols].map((i) => {
                const active = idolFilter === i.id;
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setIdolFilter(i.id)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
                      active
                        ? "border-primary/50 bg-accent/50 text-primary"
                        : "border-border/70 text-muted-foreground"
                    }`}
                  >
                    {i.name || "未命名"}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
            {[{ value: "ALL" as const, label: "全部" }, ...HEART_TYPES].map((t) => {
              const active = typeFilter === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTypeFilter(t.value)}
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-[13px] transition-colors ${
                    active
                      ? "border-primary/50 bg-accent/50 text-primary"
                      : "border-border/70 text-muted-foreground"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
          >
            <Plus className="size-4" strokeWidth={2} />
            收藏這顆糖 ♡
          </button>

          {filtered.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              這個分類還沒有收藏 ♡
            </p>
          ) : (
            <>
              <section className="mt-8">
                <h2 className="mb-3 font-display text-[15px] tracking-[0.08em]">時間軸</h2>
                <div className="space-y-6">
                  {groups.map((g) => (
                    <div key={g.year}>
                      <p className="font-display text-[18px] text-primary">{g.year}</p>
                      <div className="mt-2 space-y-4 border-l border-border/70 pl-4">
                        {g.months.map((m) => (
                          <div key={m.month}>
                            <p className="text-xs tracking-wide text-muted-foreground">
                              {m.month} 月
                            </p>
                            <ul className="mt-2 space-y-2">
                              {m.list.map((item) => (
                                <li key={item.id}>
                                  <button
                                    type="button"
                                    onClick={() => setDetail(item)}
                                    className="flex w-full items-baseline gap-2 text-left"
                                  >
                                    <span aria-hidden className="text-primary">
                                      ♡
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-sm">
                                      {item.title}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {shortDate(item.date)}
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-9 space-y-4">
                {filtered.map((item) => (
                  <HeartCard
                    key={item.id}
                    item={item}
                    idolName={idolName(item.idolId)}
                    onOpen={() => setDetail(item)}
                  />
                ))}
              </section>
            </>
          )}
        </>
      )}

      <HeartDetailSheet
        item={detail}
        idolName={detail ? idolName(detail.idolId) : ""}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        onEdit={() => {
          if (!detail) return;
          setEditing(detail);
          setFormOpen(true);
        }}
        onDelete={() => detail && setPendingDelete(detail)}
      />

      <HeartFormSheet
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        idols={idols}
        initial={editing ? toDraft(editing) : undefined}
        defaultIdolId={idolFilter === "ALL" ? undefined : idolFilter}
        title={editing ? "編輯嗑糖瞬間" : "收藏這顆糖 ♡"}
        submitLabel={editing ? "儲存" : "收藏"}
        onSubmit={submit}
      />

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent className="max-w-[20rem] rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>要把這顆糖刪掉嗎？</AlertDialogTitle>
            <AlertDialogDescription>刪除後無法復原。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">取消</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground"
              onClick={() => {
                if (pendingDelete) void remove(pendingDelete.id);
                setPendingDelete(null);
                setDetail(null);
              }}
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
