import { StoredImage } from "@/components/StoredImage";
import { useEffect, useRef, useState } from "react";
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
import { AlbumShareSheet } from "@/components/AlbumShareSheet";
import { useClaimedAlbumSource } from "@/lib/album-share";
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
import { useIdolMusicSource } from "@/lib/idol-music.source";
import { streamingLink } from "@/lib/idol-music";
import { toast } from "sonner";
import { parseLocalDate } from "@/lib/dates";

export const Route = createFileRoute("/memories/$folderId")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { memory?: string } => ({
    memory:
      typeof search.memory === "string"
        ? search.memory
        : undefined,
  }),
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
  const { memory: focusedMemoryId } = Route.useSearch();
  const navigate = useNavigate();
  const { folders, ready, updateFolder, removeFolder, mode } = useMemoryFolderSource();
  const { memories, addMemory, updateMemory, removeMemory } = useMemorySource(folderId);
  const claimedSource = useClaimedAlbumSource(folderId);
  const { idols } = useIdolSource();

  const folder = folders.find((f) => f.id === folderId);
  const idol = folder?.idolId ? idols.find((i) => i.id === folder.idolId) : undefined;
  const { songs, addSong } = useIdolMusicSource(folder?.idolId);

  const [editFolder, setEditFolder] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteFolder, setDeleteFolder] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Memory | null>(null);
  const [deletingMemory, setDeletingMemory] = useState(false);
  const focusedMemoryRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!focusedMemoryId || memories.length === 0) return;

    const timer = window.setTimeout(() => {
      focusedMemoryRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [focusedMemoryId, memories.length]);

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
        songId: editing.songId ?? "",
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
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="資料夾選單"
                className="relative z-10 inline-flex size-9 touch-manipulation items-center justify-center rounded-full bg-card/70 text-muted-foreground shadow-soft active:scale-95"
              >
                <MoreHorizontal className="size-4" strokeWidth={1.8} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="z-[80]">
              <DropdownMenuItem onSelect={() => setEditFolder(true)}>編輯資料夾</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setShareOpen(true)}>分享設定</DropdownMenuItem>
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
              className="mb-5 aspect-[4/3] w-full rounded-[2rem] object-cover shadow-soft"
            />
          ) : null}
          <p className="text-[11px] font-semibold tracking-[0.16em] text-primary">
            OUR MEMORIES ♡
          </p>
          <h1 className="mt-2 font-display text-[28px] leading-snug font-semibold">
            {folder.title}
          </h1>
          {folder.description ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{folder.description}</p>
          ) : null}
          {claimedSource ? (
            <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/[0.06] px-4 py-3">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-primary">IDOLDAYS SHARE ♡</p>
              <p className="mt-1 text-sm font-medium">來自 {claimedSource.senderName} 的收藏 ♡</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {new Date(claimedSource.claimedAt).toLocaleDateString("zh-TW")} 收下
              </p>
              {claimedSource.shareMessage ? (
                <p className="mt-2 text-xs leading-5 text-muted-foreground">「{claimedSource.shareMessage}」</p>
              ) : null}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-muted-foreground">
            {folder.startDate || folder.endDate ? (
              <span className="tracking-wide">
                {dotDate(folder.startDate)}
                {folder.endDate ? ` – ${dotDate(folder.endDate)}` : ""}
              </span>
            ) : null}
            <span>· {memories.length} 則回憶</span>
            {idol ? (
              <span className="rounded-full bg-accent/40 px-2.5 py-1 text-primary">♡ {idol.name}</span>
            ) : null}
          </div>
        </header>
      ) : null}

      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">
            OUR DAYS
          </p>
          <h2 className="mt-1 font-display text-[17px] font-medium">
            一起走過的日子
          </h2>
        </div>
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
                <div className="mt-4 space-y-5">
                  {g.items.map((m) => (
                    <SoftCard
                      key={m.id}
                      ref={
                        focusedMemoryId === m.id
                          ? focusedMemoryRef
                          : undefined
                      }
                      id={`memory-${m.id}`}
                      className={`overflow-hidden p-0 ${
                        focusedMemoryId === m.id
                          ? "memory-day-highlight"
                          : ""
                      }`}
                    >
                      {m.photo ? (
                        <StoredImage
                          src={m.photo}
                          alt={m.title}
                          className="aspect-[4/3] w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[16/7] w-full items-center justify-center bg-accent/20 text-primary/40">
                          <span className="text-lg select-none">♡</span>
                        </div>
                      )}
                      <div className="flex items-start gap-3 px-5 py-5">
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-[17px] font-medium">
                            {m.title || "未命名的回憶"}
                          </p>
                          {m.note ? (
                            <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                              {m.note}
                            </p>
                          ) : null}
                          {m.songId ? (() => {
                            const song = songs.find((item) => item.id === m.songId);
                            const link = song ? streamingLink(song) : "";
                            return <div className="mt-4 rounded-2xl bg-primary/8 px-3.5 py-2.5"><p className="text-xs text-primary">🎵 {song?.title ?? "已連結的歌曲"}</p>{link ? <a href={link} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-medium text-primary underline underline-offset-2">🎧 再聽一次</a> : <p className="mt-1 text-xs text-muted-foreground">到「我們的歌」補上合法串流連結</p>}</div>;
                          })() : null}
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
          onSubmit={async (draft) => {
            await updateFolder(folder.id, draft);

            setEditFolder(false);
          }}
        />
      ) : null}

      <AlbumShareSheet
        open={shareOpen}
        onOpenChange={setShareOpen}
        folderId={folderId}
        folderTitle={folder?.title ?? ""}
      />

      <MemoryFormSheet
        open={memoryOpen}
        onOpenChange={(o) => {
          setMemoryOpen(o);
          if (!o) setEditing(null);
        }}
        initial={editDraft}
        title={editing ? "編輯回憶" : "把這一天留下來 📸"}
        submitLabel={editing ? "儲存" : "留下來"}
        onSubmit={async (draft) => {
          if (editing) await updateMemory(editing.id, draft);
          else await addMemory(folderId, draft, folder?.idolId);
          setMemoryOpen(false);
          setEditing(null);
        }}
        songs={songs}
        addSong={addSong}
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
              disabled={deletingMemory}
              onClick={async (event) => {
                event.preventDefault();
                if (!pendingDelete || deletingMemory) return;
                setDeletingMemory(true);
                try {
                  await removeMemory(pendingDelete.id);
                  setPendingDelete(null);
                } catch {
                  toast.error("回憶沒有刪除成功，請確認網路後再試一次");
                } finally {
                  setDeletingMemory(false);
                }
              }}
            >
              {deletingMemory ? "刪除中…" : "刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
