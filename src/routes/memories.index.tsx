import { StoredImage } from "@/components/StoredImage";
import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FolderHeart, Plus, Images } from "lucide-react";
import { AppShell, PageHeader, EmptyState, SoftCard } from "@/components/AppShell";
import { MemoryFolderFormSheet } from "@/components/MemoryFolderFormSheet";
import { type MemoryFolder } from "@/lib/memory-folders";
import { useMemoryFolderSource } from "@/lib/memory-folders.source";
import { useMemorySource } from "@/lib/memories.source";
import { useIdolSource } from "@/lib/idols.source";
import { parseLocalDate } from "@/lib/dates";
import { CloudRetryNotice } from "@/components/CloudRetryNotice";

export const Route = createFileRoute("/memories/")({
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
  const { all } = useMemorySource();
  const { idols } = useIdolSource();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <AppShell>
      <PageHeader
        title="我的追星回憶"
        subtitle="把喜歡過的每一天，留在這裡 ♡"
      />

      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-display text-[18px] font-semibold tracking-[0.08em]">📁 回憶資料夾</h2>
        {folders.length > 0 ? (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1 min-h-11 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            新增回憶夾
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
          icon={<FolderHeart className="size-5" strokeWidth={1.6} />}
          title="還沒有回憶，先從第一張開始吧 ♡"
          description="建立第一個回憶資料夾，把那些日子放進來。"
          action={
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 min-h-[50px] rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
            >
              <Plus className="size-4" strokeWidth={2} />
              新增回憶夾
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
                <SoftCard className="overflow-hidden p-0">
                  {f.coverPhoto ? (
                    <StoredImage src={f.coverPhoto} alt={f.title} className="aspect-[4/3] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-accent/35 via-card to-lavender/30 text-primary/50">
                      <Images className="size-7" strokeWidth={1.3} />
                      <span className="text-sm tracking-[0.1em]">OUR DAYS ♡</span>
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
                          ♡ {idol.name}
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

      <MemoryFolderFormSheet
        open={open}
        onOpenChange={setOpen}
        title="建立回憶夾"
        submitLabel="建立"
        onSubmit={async (draft) => {
          const created = await addFolder(draft);
          setOpen(false);
          const folderId =
            typeof created === "string"
              ? created
              : created && typeof created === "object" && "id" in created
                ? String(created.id)
                : undefined;
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
