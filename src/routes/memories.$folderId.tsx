import { StoredImage } from "@/components/StoredImage";
import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Plus, MoreHorizontal, Images } from "lucide-react";
import { AppShell, EmptyState, SoftCard } from "@/components/AppShell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MemoryFolderFormSheet } from "@/components/MemoryFolderFormSheet";
import { MemoryFormSheet } from "@/components/MemoryFormSheet";
import { useMemoryFolderSource } from "@/lib/memory-folders.source";
import {
  groupMemoriesByDate,
  type Memory,
  type MemoryDraft,
} from "@/lib/memories";
import { useMemorySource } from "@/lib/memories.source";
import { useIdolSource } from "@/lib/idols.source";
import { parseLocalDate } from "@/lib/dates";

export const Route = createFileRoute("/memories/$folderId")({
  head: () => ({
    meta: [
      { title: "回憶資料夾｜IdolDays" },
      { name: "description", content: "用時間軸翻閱這段追星時光的照片與心得。" },
      { property: "og:title", content: "回憶資料夾｜IdolDays" },
      { property: "og:description", content: "用時間軸翻閱這段追星時光的照片與心得。" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FolderDetailPage,
});

function dotDate(value?: string) {
  const p = parseLocalDate(value);
  if (!p) return "未標記日期";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.y}.${pad(p.m)}.${pad(p.d)}`;
}

function FolderDetailPage() {
  const { folderId } = Route.useParams();
  const navigate = useNavigate();
  const { folders, ready, updateFolder, removeFolder, mode } = useMemoryFolderSource();
  const { memories, addMemory, updateMemory, removeMemory } = useMemorySource(folderId);
  const { idols } = useIdolSource();

  const folder = folders.find((f) => f.id === folderId);
  const idol = folder?.idolId ? idols.find((i) => i.id === folder.idolId) : undefined;

  const [editFolder, setEditFolder] = useState(false);
  const [deleteFolder, setDeleteFolder] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Memory | null>(null);

  if (ready && !folder) {
    return (
      <AppShell>
        <EmptyState
          title="找不到這個資料夾"
          description="它可能已經被刪除了。"
          action={
            <Link
              to="/memories"
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft"
            >
              回到回憶
            </Link>
          }
        />
      </AppShell>
    );
  }

  const groups = groupMemoriesByDate(memories);

  const editDraft: MemoryDraft | undefined = editing
    ? {
        title: editing.title,
        date: editing.date,
        note: editing.note,
        photo: editing.photo ?? "",
      }
    : undefined;

  return (
    <AppShell>
      <div className="mb-5 flex items-center justify-between">
        <Link
          to="/memories"
          className="inline-flex items-center gap-1 rounded-full bg-card/70 px-3 py-1.5 text-sm text-muted-foreground shadow-soft"
        >
          <ChevronLeft className="size-4" strokeWidth={1.8} />
          回憶
        </Link>
        {folder ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="資料夾選單"
              className="rounded-full bg-card/70 p-2 text-muted-foreground shadow-soft"
            >
              <MoreHorizontal className="size-4" strokeWidth={1.8} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditFolder(true)}>編輯資料夾</DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setDeleteFolder(true)}
              >
                刪除資料夾
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {folder ? (
        <header className="mb-8">
          {folder.coverPhoto ? (
            <StoredImage
              src={folder.coverPhoto}
              alt={folder.title}
              className="mb-4 aspect-[16/9] w-full rounded-3xl object-cover shadow-soft"
            />
          ) : null}
          <h1 className="font-display text-[26px] leading-snug font-medium">{folder.title}</h1>
          {folder.description ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{folder.description}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
            {folder.startDate || folder.endDate ? (
              <span className="rounded-full bg-surface px-2.5 py-1 tracking-wide">
                {dotDate(folder.startDate)}
                {folder.endDate ? ` – ${dotDate(folder.endDate)}` : ""}
              </span>
            ) : null}
            <span className="rounded-full bg-surface px-2.5 py-1">{memories.length} 則回憶</span>
            {idol ? (
              <span className="rounded-full bg-accent/40 px-2.5 py-1 text-primary">♡ {idol.name}</span>
            ) : null}
          </div>
        </header>
      ) : null}

      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-display text-[15px] font-medium tracking-[0.08em]">回憶時間軸</h2>
        {memories.length > 0 ? (
          <button
            onClick={() => {
              setEditing(null);
              setMemoryOpen(true);
            }}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            留下回憶
          </button>
        ) : null}
      </div>

      {memories.length === 0 ? (
        <EmptyState
          icon={<Images className="size-5" strokeWidth={1.6} />}
          title="還沒有回憶，先從第一張開始吧 ♡"
          description="把這一天留下來 📸 之後就能慢慢翻。"
          action={
            <button
              onClick={() => {
                setEditing(null);
                setMemoryOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
            >
              <Plus className="size-4" strokeWidth={2} />
              留下回憶
            </button>
          }
        />
      ) : (
        <div className="relative pl-6">
          <span
            aria-hidden
            className="pointer-events-none absolute top-2 bottom-2 left-[7px] w-px bg-border/70"
          />
          <div className="space-y-8">
            {groups.map((g) => (
              <div key={g.date} className="relative">
                <span
                  aria-hidden
                  className="absolute top-1.5 -left-6 size-[15px] rounded-full border-2 border-primary/60 bg-card"
                />
                <p className="font-display text-[13px] tracking-[0.14em] text-muted-foreground">
                  {dotDate(g.date)}
                </p>
                <div className="mt-3 space-y-4">
                  {g.items.map((m) => (
                    <SoftCard key={m.id} className="overflow-hidden p-0">
                      {m.photo ? (
                        <StoredImage src={m.photo} alt={m.title} className="aspect-[4/3] w-full object-cover" />
                      ) : (
                        <div className="flex aspect-[16/7] w-full items-center justify-center bg-accent/20 text-primary/40">
                          <span className="text-lg select-none">♡</span>
                        </div>
                      )}
                      <div className="flex items-start gap-3 px-5 py-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-medium">{m.title || "未命名的回憶"}</p>
                          {m.note ? (
                            <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                              {m.note}
                            </p>
                          ) : null}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label="回憶選單"
                            className="-mr-1 shrink-0 rounded-full p-1.5 text-muted-foreground"
                          >
                            <MoreHorizontal className="size-4" strokeWidth={1.8} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => {
                                setEditing(m);
                                setMemoryOpen(true);
                              }}
                            >
                              編輯
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() => setPendingDelete(m)}
                            >
                              刪除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </SoftCard>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {folder ? (
        <MemoryFolderFormSheet
          open={editFolder}
          onOpenChange={setEditFolder}
          initial={{
            idolId: folder.idolId ?? "",
            title: folder.title,
            description: folder.description ?? "",
            coverPhoto: folder.coverPhoto ?? "",
            startDate: folder.startDate ?? "",
            endDate: folder.endDate ?? "",
          }}
          title="編輯資料夾"
          submitLabel="儲存"
          onSubmit={(draft) => {
            void updateFolder(folder.id, draft);
            setEditFolder(false);
          }}
        />
      ) : null}

      <MemoryFormSheet
        open={memoryOpen}
        onOpenChange={(o) => {
          setMemoryOpen(o);
          if (!o) setEditing(null);
        }}
        initial={editDraft}
        title={editing ? "編輯回憶" : "把這一天留下來 📸"}
        submitLabel={editing ? "儲存" : "留下來"}
        onSubmit={(draft) => {
          if (editing) void updateMemory(editing.id, draft);
          else void addMemory(folderId, draft, folder?.idolId);
          setMemoryOpen(false);
          setEditing(null);
        }}
      />

      <AlertDialog open={deleteFolder} onOpenChange={setDeleteFolder}>
        <AlertDialogContent className="max-w-[20rem] rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>要刪除這個資料夾嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              裡面的回憶也會一起被刪除，這個動作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">取消</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground"
              onClick={() => {
                void (async () => {
                  // 雲端會一併刪除資料夾底下的回憶；本機則手動清除
                  if (mode === "local") {
                    const { deleteMemoriesForFolder } = await import("@/lib/memories");
                    deleteMemoriesForFolder(folderId);
                  }
                  await removeFolder(folderId);
                  navigate({ to: "/memories" });
                })();
              }}
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent className="max-w-[20rem] rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>這張真的要刪掉嗎……🥹</AlertDialogTitle>
            <AlertDialogDescription>刪掉之後就真的找不回來了。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">取消</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground"
              onClick={() => {
                if (pendingDelete) void removeMemory(pendingDelete.id);
                setPendingDelete(null);
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
