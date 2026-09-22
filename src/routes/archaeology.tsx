import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bookmark,
  ExternalLink,
  FolderHeart,
  Heart,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { AppShell, PageHeader, SoftCard } from "@/components/AppShell";
import { ArchaeologyFormSheet } from "@/components/ArchaeologyFormSheet";
import { StoredImage } from "@/components/StoredImage";
import { Input } from "@/components/ui/input";
import { CloudRetryNotice } from "@/components/CloudRetryNotice";

import {
  type ArchaeologyDraft,
  type ArchaeologyItem,
  type ArchaeologySource,
} from "@/lib/archaeology";
import { useArchaeologySource } from "@/lib/archaeology.source";
import { toast } from "sonner";

export const Route = createFileRoute("/archaeology")({
  head: () => ({
    meta: [
      { title: "考古｜IdolDays" },
      {
        name: "description",
        content: "把散落在飯圈各處的寶藏收回來。",
      },
      {
        property: "og:title",
        content: "考古｜IdolDays",
      },
      {
        property: "og:description",
        content: "把散落在飯圈各處的寶藏收回來。",
      },
    ],
  }),
  component: ArchaeologyPage,
});

type ViewMode = "RECENT" | "FAVORITES" | "COLLECTIONS";

const SOURCE_LABELS: Record<ArchaeologySource, string> = {
  THREADS: "Threads",
  X: "X",
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  WEB: "網頁",
};

function ArchaeologyPage() {
  const { items, ready, addItem, updateItem, toggleFavorite, removeItem, error, reload } =
    useArchaeologySource();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ArchaeologyItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ArchaeologyItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("RECENT");
  const [activeCollection, setActiveCollection] = useState<string | null>(null);

  const collections = useMemo(() => {
    const counts = new Map<string, number>();

    for (const item of items) {
      const name = item.collection.trim();
      if (!name) continue;

      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      if (view === "FAVORITES" && !item.favorite) {
        return false;
      }

      if (activeCollection && item.collection !== activeCollection) {
        return false;
      }

      if (!normalizedQuery) return true;

      const haystack = [item.title, item.note, item.collection, item.source, ...item.tags]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [items, query, view, activeCollection]);

  function selectView(next: ViewMode) {
    setView(next);

    if (next !== "COLLECTIONS") {
      setActiveCollection(null);
    }
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(item: ArchaeologyItem) {
    setEditing(item);
    setFormOpen(true);
  }

  const editDraft: ArchaeologyDraft | undefined = editing
    ? {
        url: editing.url,
        title: editing.title,
        imageUrl: editing.imageUrl ?? "",
        idolId: editing.idolId,
        collection: editing.collection,
        tags: [...editing.tags],
        note: editing.note,
      }
    : undefined;

  return (
    <AppShell>
      <PageHeader
        title="考古 🔎"
        subtitle="Threads・X・直拍・名場面 ♡"
        action={
          <button
            type="button"
            onClick={openCreate}
            aria-label="收藏新的考古"
            className="mb-1 flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-transform duration-300 active:scale-90"
          >
            <Plus className="size-4" strokeWidth={2} />
          </button>
        }
      />

      {error ? (
        <CloudRetryNotice onRetry={reload}>
          目前連不上雲端資料，你的考古收藏沒有遺失，請稍後再試。
        </CloudRetryNotice>
      ) : null}

      <div className="space-y-4">
        <div className="relative">
          <Search
            className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.6}
          />

          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜貼文、直拍、名場面…"
            className="h-12 rounded-full border-border/60 bg-card/70 pl-11 shadow-soft"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5">
          <FilterButton
            active={view === "RECENT"}
            label="最近收藏"
            Icon={Bookmark}
            onClick={() => selectView("RECENT")}
          />

          <FilterButton
            active={view === "FAVORITES"}
            label="最愛"
            Icon={Heart}
            onClick={() => selectView("FAVORITES")}
          />

          <FilterButton
            active={view === "COLLECTIONS"}
            label="收藏集"
            Icon={FolderHeart}
            onClick={() => selectView("COLLECTIONS")}
          />
        </div>

        {view === "COLLECTIONS" ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">我的收藏集</h2>

              {activeCollection ? (
                <button
                  type="button"
                  onClick={() => setActiveCollection(null)}
                  className="min-h-11 text-sm text-muted-foreground"
                >
                  顯示全部
                </button>
              ) : null}
            </div>

            {collections.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {collections.map((collection) => (
                  <button
                    key={collection.name}
                    type="button"
                    onClick={() =>
                      setActiveCollection(
                        activeCollection === collection.name ? null : collection.name,
                      )
                    }
                    className={[
                      "rounded-2xl border px-4 py-4 text-left transition-all",
                      activeCollection === collection.name
                        ? "border-primary/40 bg-primary/10"
                        : "border-border/60 bg-surface/50",
                    ].join(" ")}
                  >
                    <FolderHeart className="mb-3 size-5 text-primary" strokeWidth={1.5} />

                    <p className="truncate text-base font-medium">{collection.name}</p>

                    <p className="mt-1 text-sm text-muted-foreground">{collection.count} 篇</p>
                  </button>
                ))}
              </div>
            ) : (
              <SoftCard className="px-5 py-6 text-center">
                <p className="text-sm font-medium">還沒有收藏集</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  收藏考古時，可以順手把它們分進收藏集。
                </p>
              </SoftCard>
            )}
          </section>
        ) : null}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">
              {view === "FAVORITES" ? "我的最愛" : activeCollection ? activeCollection : "最近收藏"}
            </h2>

            {items.length > 0 ? (
              <span className="min-h-11 text-sm text-muted-foreground">{visibleItems.length} 篇</span>
            ) : null}
          </div>

          {!ready ? (
            <SoftCard className="px-5 py-8 text-center text-sm text-muted-foreground">
              載入中...
            </SoftCard>
          ) : visibleItems.length > 0 ? (
            <div className="space-y-3">
              {visibleItems.map((item) => (
                <ArchaeologyCard
                  key={item.id}
                  item={item}
                  onToggleFavorite={() => toggleFavorite(item.id)}
                  onEdit={() => openEdit(item)}
                  onDelete={() => setPendingDelete(item)}
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <SoftCard className="px-6 py-10 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-surface">
                <Bookmark className="size-5 text-muted-foreground" strokeWidth={1.5} />
              </div>

              <p className="mt-4 text-[15px] font-medium">還沒開始考古</p>

              <p className="mx-auto mt-2 max-w-[250px] text-sm leading-relaxed text-muted-foreground">
                刷到捨不得忘記的物料，就收進來 ♡
              </p>

              <button
                type="button"
                onClick={openCreate}
                className="mt-5 min-h-[50px] rounded-full bg-primary px-5 py-3 text-base font-medium text-primary-foreground shadow-soft"
              >
                ＋ 第一篇考古
              </button>
            </SoftCard>
          ) : (
            <SoftCard className="px-5 py-8 text-center">
              <p className="text-sm font-medium">沒找到那個瞬間</p>
              <p className="mt-1 text-sm text-muted-foreground">換個關鍵字看看。</p>
            </SoftCard>
          )}
        </section>
      </div>

      <ArchaeologyFormSheet
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);

          if (!open) {
            setEditing(null);
          }
        }}
        initial={editDraft}
        title={editing ? "編輯考古" : "收進考古"}
        submitLabel={editing ? "儲存修改" : "收進考古"}
        onSubmit={async (draft) => {
          if (editing) {
            await updateItem(editing.id, draft);
          } else {
            await addItem(draft);
          }

          setFormOpen(false);
          setEditing(null);
          setView("RECENT");
          setActiveCollection(null);
        }}
      />

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="w-full max-w-md rounded-3xl bg-card p-5 shadow-xl">
            <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="size-5" strokeWidth={1.7} />
            </div>

            <h2 className="mt-4 text-lg font-medium">刪除這篇考古？</h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              「{pendingDelete.title}」會從你的考古收藏中移除。 原始貼文不會受到影響。
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="flex-1 rounded-full border border-border/70 min-h-[50px] py-3 text-base"
              >
                取消
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  if (deleting) return;
                  setDeleting(true);
                  try {
                    await removeItem(pendingDelete.id);
                    setPendingDelete(null);
                  } catch {
                    toast.error("考古沒有刪除成功，請確認網路後再試一次");
                  } finally {
                    setDeleting(false);
                  }
                }}
                className="flex-1 rounded-full bg-destructive min-h-[50px] py-3 text-base font-medium text-destructive-foreground disabled:opacity-60"
              >
                {deleting ? "刪除中…" : "刪除"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function FilterButton({
  active,
  label,
  Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  Icon: typeof Bookmark;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex shrink-0 items-center justify-center gap-1.5 rounded-full border min-h-11 px-4 py-2 text-sm transition-all",
        active
          ? "border-primary/30 bg-primary/10 text-foreground"
          : "border-border/60 bg-surface/40 text-muted-foreground",
      ].join(" ")}
    >
      <Icon className="size-4" strokeWidth={active ? 1.9 : 1.5} />
      {label}
    </button>
  );
}

const PREVIEW_VIDEO_SOURCES: ArchaeologySource[] = [
  "THREADS",
  "INSTAGRAM",
  "TIKTOK",
  "X",
  "YOUTUBE",
];

function isVideoPreviewSource(source: ArchaeologySource) {
  return PREVIEW_VIDEO_SOURCES.includes(source);
}

function VideoFallback({ source, url }: { source: ArchaeologySource; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-3 flex aspect-[16/9] w-full flex-col items-center justify-center rounded-2xl bg-surface/70 text-muted-foreground transition-opacity active:opacity-70"
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-background/90 text-primary shadow-sm">
        <span className="ml-0.5 text-lg">▶</span>
      </div>

      <p className="mt-2 text-xs">{SOURCE_LABELS[source]} 影片</p>

      <p className="mt-1 text-sm text-muted-foreground/70">點一下回原文觀看</p>
    </a>
  );
}

function ArchaeologyCover({
  imageUrl,
  title,
  source,
  url,
}: {
  imageUrl: string;
  title: string;
  source: ArchaeologySource;
  url: string;
}) {
  const [failed, setFailed] = useState(false);
  const showPlay = isVideoPreviewSource(source);

  if (failed) {
    return showPlay ? <VideoFallback source={source} url={url} /> : null;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative mb-3 block overflow-hidden rounded-2xl bg-surface"
    >
      <StoredImage
        src={imageUrl}
        alt={title}
        className="aspect-[16/9] w-full object-cover"
        onError={() => setFailed(true)}
      />

      {showPlay ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-background/90 text-primary shadow-sm">
            <span className="ml-0.5 text-lg">▶</span>
          </div>
        </div>
      ) : null}
    </a>
  );
}

function ArchaeologyCard({
  item,
  onToggleFavorite,
  onEdit,
  onDelete,
}: {
  item: ArchaeologyItem;
  onToggleFavorite: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <SoftCard className="px-4 py-3.5">
      {item.imageUrl ? (
        <ArchaeologyCover
          imageUrl={item.imageUrl}
          title={item.title}
          source={item.source}
          url={item.url}
        />
      ) : isVideoPreviewSource(item.source) ? (
        <VideoFallback source={item.source} url={item.url} />
      ) : null}

      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-surface px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground">
              {SOURCE_LABELS[item.source]}
            </span>

            {item.collection ? (
              <span className="text-[13px] text-muted-foreground">{item.collection}</span>
            ) : null}
          </div>

          <p className="mt-2.5 pr-1 text-[15px] font-medium leading-snug">{item.title}</p>

          {item.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
              {item.tags.map((tag) => (
                <span key={tag} className="text-xs text-primary/80">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          {item.note ? (
            <p className="mt-2.5 whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
              {item.note}
            </p>
          ) : null}
        </div>

        <div className="relative flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onToggleFavorite}
            className="flex size-11 items-center justify-center rounded-full bg-surface"
            aria-label={item.favorite ? "取消最愛" : "加入最愛"}
          >
            <Heart
              className={[
                "size-4",
                item.favorite ? "fill-primary text-primary" : "text-muted-foreground",
              ].join(" ")}
              strokeWidth={1.7}
            />
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex size-11 items-center justify-center rounded-full bg-surface text-muted-foreground"
            aria-label="更多操作"
          >
            <MoreHorizontal className="size-4" strokeWidth={1.7} />
          </button>

          {menuOpen ? (
            <div className="absolute top-11 right-0 z-20 w-36 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm"
              >
                <Pencil className="size-4" strokeWidth={1.6} />
                編輯
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="flex w-full items-center gap-2 border-t border-border/50 px-4 py-3 text-left text-sm text-destructive"
              >
                <Trash2 className="size-4" strokeWidth={1.6} />
                刪除
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5">
        <span className="text-[13px] text-muted-foreground">
          {new Date(item.createdAt).toLocaleDateString("zh-TW")}
        </span>

        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 min-h-11 text-sm font-medium text-primary"
        >
          回原文
          <ExternalLink className="size-3.5" strokeWidth={1.7} />
        </a>
      </div>
    </SoftCard>
  );
}
