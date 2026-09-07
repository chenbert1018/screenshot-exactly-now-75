import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderHeart, Plus, Images } from "lucide-react";
import { AppShell, EmptyState, SoftCard } from "@/components/AppShell";
import { MemoryFolderFormSheet } from "@/components/MemoryFolderFormSheet";
import { useMemoryFolders, type MemoryFolder } from "@/lib/memory-folders";
import { useMemories } from "@/lib/memories";
import { useIdols } from "@/lib/idols";
import { parseLocalDate } from "@/lib/dates";

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
  const { folders, ready, addFolder } = useMemoryFolders();
  const { all } = useMemories();
  const { idols } = useIdols();
  const [open, setOpen] = useState(false);

  return (
    <AppShell>
      <header className="mb-7">
        <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">Memories</p>
        <h1 className="mt-2 font-display text-[26px] leading-snug font-medium">我的追星回憶</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          把喜歡過的每一天，留在這裡 ♡
        </p>
      </header>

      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-display text-[15px] font-medium tracking-[0.08em]">📁 回憶資料夾</h2>
        {folders.length > 0 ? (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            建立資料夾
          </button>
        ) : null}
      </div>

      {!ready ? (
        <div className="h-40 rounded-3xl border border-border/60 bg-surface/40" aria-hidden />
      ) : folders.length === 0 ? (
        <EmptyState
          icon={<FolderHeart className="size-5" strokeWidth={1.6} />}
          title="還沒有收藏任何回憶"
          description="建立第一個回憶資料夾吧 ♡"
          action={
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
            >
              <Plus className="size-4" strokeWidth={2} />
              建立資料夾
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
                    <img src={f.coverPhoto} alt={f.title} className="aspect-[16/9] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[16/9] w-full items-center justify-center bg-accent/25 text-primary/50">
                      <Images className="size-7" strokeWidth={1.3} />
                    </div>
                  )}
                  <div className="px-5 py-4">
                    <p className="font-display text-[17px] font-medium">{f.title}</p>
                    {f.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{f.description}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {range ? (
                        <span className="rounded-full bg-surface px-2.5 py-1 tracking-wide">{range}</span>
                      ) : null}
                      <span className="rounded-full bg-surface px-2.5 py-1">{count} 則回憶</span>
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
        title="建立回憶資料夾"
        submitLabel="建立"
        onSubmit={(draft) => {
          addFolder(draft);
          setOpen(false);
        }}
      />
    </AppShell>
  );
}
