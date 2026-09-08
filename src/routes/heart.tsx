import { StoredImage } from "@/components/StoredImage";
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState, SoftCard } from "@/components/AppShell";
import { HeartFormSheet } from "@/components/HeartFormSheet";
import {
  HeartDetailSheet,
  SugarPlaceholder,
  dotDate,
} from "@/components/HeartDetailSheet";
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
  sortHeartItemsByCollected,
  type HeartDraft,
  type HeartItem,
  type HeartItemType,
} from "@/lib/heart";
import { type Idol } from "@/lib/idols";
import { useIdolSource } from "@/lib/idols.source";
import { useSugarSource } from "@/lib/sugar.source";

export const Route = createFileRoute("/heart")({
  head: () => ({
    meta: [
      { title: "嗑糖｜IdolDays" },
      { name: "description", content: "收藏那些讓我忍不住嘴角上揚的瞬間。" },
      { property: "og:title", content: "嗑糖｜IdolDays" },
      { property: "og:description", content: "收藏那些讓我忍不住嘴角上揚的瞬間 🍬" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HeartPage,
});

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
          <StoredImage
            src={item.image}
            alt={item.title}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <SugarPlaceholder item={item} name={idolName} />
        )}
        <div className="px-4 py-4">
          <span className="inline-flex rounded-full bg-surface px-2.5 py-1 text-[13px] text-muted-foreground">
            {heartTypeLabel(item.type)}
          </span>
          <p className="mt-2 font-display text-[16px] leading-snug">{item.title}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {dotDate(item.date)}・{idolName}
          </p>
        </div>
      </SoftCard>
    </button>
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

  // 我的糖庫：最新收藏 → 最舊收藏
  const filtered = useMemo(
    () =>
      sortHeartItemsByCollected(items)
        .filter((i) => (idolFilter === "ALL" ? true : i.idolId === idolFilter))
        .filter((i) => (typeFilter === "ALL" ? true : i.type === typeFilter)),
    [items, idolFilter, typeFilter],
  );

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
    if (editing) {
      void update(editing.id, draft);
      toast("這顆糖更新好了 ♡");
    } else {
      void add(draft);
      toast("收好了 ♡", { description: "這顆糖以後可以慢慢嗑。" });
    }
    setFormOpen(false);
    setEditing(null);
    setDetail(null);
  }

  return (
    <AppShell>
      <header className="mb-7">
        <p className="text-[13px] tracking-[0.28em] text-muted-foreground uppercase">
          My Sugar Archive
        </p>
        <h1 className="mt-2 font-display text-[28px] leading-tight font-medium">🍬 嗑糖</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          收藏那些讓我忍不住嘴角上揚的瞬間。
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
          title="還沒有糖可以嗑 👀"
          description="第一顆糖就從今天開始收藏。"
          action={
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
            >
              🍬 收藏第一顆糖
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
              這個分類還沒有糖，再去挖一下 👀
            </p>
          ) : (
            <section className="mt-8 space-y-4">
              {filtered.map((item) => (
                <HeartCard
                  key={item.id}
                  item={item}
                  idolName={idolName(item.idolId)}
                  onOpen={() => setDetail(item)}
                />
              ))}
            </section>
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
        title={editing ? "編輯這顆糖" : "收藏這顆糖 ♡"}
        submitLabel={editing ? "儲存" : "收藏這顆糖 ♡"}
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
                if (pendingDelete) void remove(pendingDelete.id);
                setPendingDelete(null);
                setDetail(null);
              }}
            >
              還是刪掉
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
