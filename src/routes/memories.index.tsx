import { StoredImage } from "@/components/StoredImage";
import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, ChevronRight } from "lucide-react";
import { MemoryFolderIcon, PhotocardStackIcon, CollectionIcon } from "@/components/IdolDaysIcons";
import { AppShell, PageHeader, EmptyState, SoftCard } from "@/components/AppShell";
import { MemoryFolderFormSheet } from "@/components/MemoryFolderFormSheet";
import { type MemoryFolder } from "@/lib/memory-folders";
import { useMemoryFolderSource } from "@/lib/memory-folders.source";
import { useMemorySource } from "@/lib/memories.source";
import { useIdolSource } from "@/lib/idols.source";
import { parseLocalDate } from "@/lib/dates";
import { CloudRetryNotice } from "@/components/CloudRetryNotice";
import { useAuth } from "@/lib/auth";
import { getComebackEraByEvent, linkComebackEra } from "@/lib/comeback-era.source";

export const Route = createFileRoute("/memories/")({
  validateSearch: (search: Record<string, unknown>) => ({
    create: search.create === "comeback" ? ("comeback" as const) : search.create === "1" ? ("1" as const) : undefined,
    title: typeof search.title === "string" ? search.title : undefined,
    date: typeof search.date === "string" ? search.date : undefined,
    event: typeof search.event === "string" ? search.event : undefined,
    idol: typeof search.idol === "string" ? search.idol : undefined,
  }),
  head: () => ({
    meta: [
      { title: "我的追星回憶｜IdolDays" },
      { name: "description", content: "把喜歡過的每一天，收進屬於你的回憶資料夾。" },
      { property: "og:title", content: "我的追星回憶｜IdolDays" },
      { property: "og:description", content: "把喜歡過的每一天，收進屬於你的回憶資料夾。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MemoriesPage,
});

export function dotDate(value?: string) {
  const p = parseLocalDate(value);
  if (!p) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.y}.${pad(p.m)}.${pad(p.d)}`;
}

function rangeLabel(folder: MemoryFolder) {
  const s = dotDate(folder.startDate);
  const e = dotDate(folder.endDate);
  if (s && e) return s === e ? s : `${s} – ${e}`;
  return s || e || "";
}

function MemoriesPage() {
  const { folders, ready, addFolder, error, reload } = useMemoryFolderSource();
  const { user } = useAuth();
  const { all } = useMemorySource();
  const { idols } = useIdolSource();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const search = Route.useSearch();
  const eventInitial = search.create === "1" && search.event
    ? {
        title: search.title?.trim() || "",
        description: "",
        coverPhoto: "",
        startDate: search.date?.slice(0, 10) || "",
        endDate: "",
        idolId: search.idol || "",
      }
    : undefined;
  const comebackInitial = search.create === "comeback"
    ? {
        title: search.title?.trim() || "回歸回憶",
        description: "這次回歸的歌、心情和追星回憶 ♡",
        coverPhoto: "",
        startDate: search.date?.slice(0, 10) || "",
        endDate: "",
        idolId: search.idol || "",
      }
    : undefined;

  useEffect(() => {
    if (search.create === "1") {
      setOpen(true);
      return;
    }
    if (search.create !== "comeback") return;
    if (!search.event) {
      setOpen(true);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const existing = await getComebackEraByEvent(search.event!);
        if (!active) return;
        if (existing?.folderId) {
          await navigate({
            to: "/memories/$folderId",
            params: { folderId: existing.folderId },
          });
          return;
        }
        setOpen(true);
      } catch {
        if (active) setOpen(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [search.create, search.event, navigate]);

  return (
    <AppShell>
      <PageHeader
        title="我的回憶"
        subtitle="照片・日子・歌 ♡"
      />

      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="flex items-center gap-2 font-display text-[18px] font-semibold tracking-[0.08em]">
          <MemoryFolderIcon className="size-5 text-primary" />
          回憶資料夾
        </h2>
        {folders.length > 0 ? (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1 min-h-11 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            回憶夾
          </button>
        ) : null}
      </div>

      {error ? (
        <CloudRetryNotice onRetry={reload}>
          目前連不上雲端資料，你的回憶沒有遺失，請稍後再試。
        </CloudRetryNotice>
      ) : null}

      {!ready ? (
        <div className="h-40 rounded-3xl border border-border/60 bg-surface/40" aria-hidden />
      ) : folders.length === 0 ? (
        <EmptyState
          icon={<MemoryFolderIcon className="size-5" />}
          title="還沒有收藏，先從第一個日子開始吧"
          description="建立第一個回憶資料夾，把那些日子放進來。"
          action={
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 min-h-[50px] rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
            >
              <Plus className="size-4" strokeWidth={2} />
              建立第一個回憶夾
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {folders.map((f) => {
            const count = all.filter((m) => m.folderId === f.id).length;
            const idol = f.idolId ? idols.find((i) => i.id === f.idolId) : undefined;
            const range = rangeLabel(f);
            return (
              <Link
                key={f.id}
                to="/memories/$folderId"
                params={{ folderId: f.id }}
                className="block transition-transform duration-300 active:scale-[0.98]"
              >
                <SoftCard className="overflow-hidden rounded-[1.9rem] p-0">
                  {f.coverPhoto ? (
                    <StoredImage src={f.coverPhoto} alt={f.title} className="aspect-[4/3] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-accent/35 via-card to-lavender/30 text-primary/50">
                      <PhotocardStackIcon className="size-7" />
                      <span className="text-sm tracking-[0.1em]">OUR DAYS</span>
                    </div>
                  )}
                  <div className="px-5 py-4">
                    <p className="font-display text-[19px] font-medium">{f.title}</p>
                    {f.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{f.description}</p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
                      {range ? (
                        <span className="tracking-wide">{range}</span>
                      ) : null}
                      <span>· {count} 則回憶</span>
                      {idol ? (
                        <span className="rounded-full bg-accent/40 px-2.5 py-1 text-primary">
                          {idol.name}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </SoftCard>
              </Link>
            );
          })}
        </div>
      )}

      <Link
        to="/collection"
        className="mt-5 flex min-h-[56px] items-center gap-3 rounded-[1.35rem] border border-border/60 bg-surface/45 px-4 py-2.5 text-muted-foreground transition-transform active:scale-[0.98]"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CollectionIcon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-foreground">我的收藏</span>
          <span className="block truncate text-xs">專輯・小卡・票根・應援物</span>
        </span>
        <ChevronRight className="size-4 shrink-0" />
      </Link>

      <MemoryFolderFormSheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next && search.create) {
            void navigate({ to: "/memories", search: {} });
          }
        }}
        initial={comebackInitial ?? eventInitial ?? (search.create === "1" && search.idol ? { title: "", description: "", coverPhoto: "", startDate: "", endDate: "", idolId: search.idol } : undefined)}
        title={search.create === "comeback" ? "建立回歸回憶 ♡" : "建立回憶夾 ♡"}
        submitLabel="建立"
        onSubmit={async (draft) => {
          const created = await addFolder(draft);
          const folderId = created.id;

          if (
            search.create === "comeback" &&
            search.event &&
            user?.id
          ) {
            await linkComebackEra(user.id, search.event, folderId);
          }

          setOpen(false);
          if (folderId) {
            await navigate({
              to: "/memories/$folderId",
              params: { folderId },
            });
          }
        }}
      />
    </AppShell>
  );
}
