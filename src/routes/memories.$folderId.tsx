import { StoredImage } from "@/components/StoredImage";
import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Plus, MoreHorizontal, Images, Share2 } from "lucide-react";
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
import { useComebackEra } from "@/lib/comeback-era.source";
import { useEventSource } from "@/lib/events.source";
import { useConcertMusicMemoryHistory } from "@/lib/concert-music-memory.source";

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
  const comebackEra = useComebackEra(folderId);
  const { events } = useEventSource();
  const concertHistory = useConcertMusicMemoryHistory(folder?.idolId);

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
          className="inline-flex items-center gap-1 rounded-full bg-card/70 min-h-11 px-3 py-2 text-base text-muted-foreground shadow-soft"
        >
          <ChevronLeft className="size-4" strokeWidth={1.8} />
          回憶
        </Link>
        {folder ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-transform active:scale-95"
              aria-label="分享這本回憶"
            >
              <Share2 className="size-4" strokeWidth={1.8} />
              分享
            </button>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="資料夾選單"
                className="relative z-10 inline-flex size-11 touch-manipulation items-center justify-center rounded-full bg-card/70 text-muted-foreground shadow-soft active:scale-95"
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
          </div>
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
          <p className="text-[13px] font-semibold tracking-[0.14em] text-primary">
            OUR MEMORIES ♡
          </p>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="mt-4 flex w-full items-center justify-between gap-4 rounded-[1.5rem] border border-primary/15 bg-primary/[0.07] px-5 py-4 text-left transition-transform active:scale-[0.98]"
          >
            <span className="min-w-0">
              <span className="block text-base font-semibold text-foreground">把這本回憶送給一起追星的人 ♡</span>
              <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">對方可以預覽，再收進自己的 IdolDays。</span>
            </span>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">
              <Share2 className="size-5" strokeWidth={1.8} />
            </span>
          </button>
          <h1 className="mt-2 font-display text-[28px] leading-snug font-semibold">
            {folder.title}
          </h1>
          {folder.description ? (
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">{folder.description}</p>
          ) : null}
          {claimedSource ? (
            <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/[0.06] px-4 py-3">
              <p className="text-[13px] font-semibold tracking-[0.12em] text-primary">IDOLDAYS SHARE ♡</p>
              <p className="mt-1 text-sm font-medium">來自 {claimedSource.senderName} 的收藏 ♡</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(claimedSource.claimedAt).toLocaleDateString("zh-TW")} 收下
              </p>
              {claimedSource.shareMessage ? (
                <p className="mt-2 text-sm leading-5 text-muted-foreground">「{claimedSource.shareMessage}」</p>
              ) : null}
            </div>
          ) : null}
          {comebackEra.link ? (
            <section className="mt-5 rounded-[1.75rem] border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-card to-accent/20 px-5 py-5 shadow-soft">
              <p className="text-[13px] font-semibold tracking-[0.14em] text-primary">
                THE ERA BEGINS ♡
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {dotDate(folder.startDate)} · COMEBACK
              </p>
              <h2 className="mt-3 font-display text-[20px] font-semibold">
                {folder.title}
              </h2>

              {comebackEra.diary ? (
                <>
                  {comebackEra.diary.firstListenRating != null ? (
                    <p className="mt-3 text-base font-medium">
                      第一耳 {"★".repeat(comebackEra.diary.firstListenRating)}
                      <span className="text-muted-foreground">
                        {"☆".repeat(5 - comebackEra.diary.firstListenRating)}
                      </span>
                    </p>
                  ) : null}

                  <div className="mt-4 space-y-2">
                    {[
                      ["第一耳最喜歡", comebackEra.diary.firstFavoriteSongId],
                      ["後來最喜歡", comebackEra.diary.laterFavoriteSongId],
                      ["最想現場聽", comebackEra.diary.wantToHearLiveSongId],
                    ].map(([role, songId]) => {
                      if (!songId) return null;
                      const song = songs.find((item) => item.id === songId);
                      if (!song) return null;
                      return (
                        <div key={role} className="rounded-2xl bg-card/70 px-4 py-3">
                          <p className="text-[13px] text-muted-foreground">{role}</p>
                          <p className="mt-0.5 text-base font-medium">♪ {song.title}</p>
                        </div>
                      );
                    })}
                  </div>

                  {comebackEra.diary.note ? (
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {comebackEra.diary.note}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  這次 Comeback 是這段 Era 的開始。之後留下的照片、歌和日子，都會從這裡往下長。
                </p>
              )}

              <p className="mt-4 border-t border-primary/10 pt-4 text-sm font-medium text-primary">
                這是這段 Era 的開始。
              </p>
            </section>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
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

      {folder && comebackEra.link ? (() => {
        const start = folder.startDate || "";
        const eraMemories = memories.map((memory) => ({
          id: `memory-${memory.id}`,
          date: memory.date || memory.createdAt,
          label: memory.songId ? "MEMORY + MUSIC" : "MEMORY",
          title: memory.title || "我們的一天",
          song: memory.songId ? songs.find((song) => song.id === memory.songId)?.title : undefined,
        }));
        const concertItems = concertHistory.entries
          .map((entry) => {
            const event = events.find((item) => item.id === entry.eventId);
            if (!event || (start && event.date < start)) return null;
            const songIds = [
              entry.openingSongId,
              entry.finallyHeardSongId,
              entry.unforgettableSongId,
            ].filter(Boolean);
            const song = songIds
              .map((id) => songs.find((item) => item.id === id)?.title)
              .find(Boolean);
            return {
              id: `concert-${entry.id}`,
              date: event.date || entry.createdAt,
              label: "CONCERT",
              title: event.title || "Concert Music Memory",
              song,
            };
          })
          .filter((item): item is NonNullable<typeof item> => Boolean(item));
        const diary = comebackEra.diary;
        const favoriteChanged =
          diary?.firstFavoriteSongId &&
          diary?.laterFavoriteSongId &&
          diary.firstFavoriteSongId !== diary.laterFavoriteSongId;

        const favoriteChangeItem = favoriteChanged
          ? (() => {
              const firstSong = songs.find((song) => song.id === diary.firstFavoriteSongId);
              const laterSong = songs.find((song) => song.id === diary.laterFavoriteSongId);
              if (!laterSong) return null;
              return {
                id: `favorite-change-${diary.id}`,
                date: diary.updatedAt || diary.createdAt,
                label: "MY TASTE CHANGED ♡",
                title: firstSong
                  ? `從 ♪ ${firstSong.title}，慢慢變成最喜歡 ♪ ${laterSong.title}`
                  : `後來最喜歡的是 ♪ ${laterSong.title}`,
                song: laterSong.title,
              };
            })()
          : null;

        const growth = [
          ...eraMemories,
          ...concertItems,
          ...(favoriteChangeItem ? [favoriteChangeItem] : []),
        ]
          .filter((item) => !start || item.date >= start)
          .sort((a, b) => a.date.localeCompare(b.date));

        if (growth.length === 0) return null;

        return (
          <section className="mb-8">
            <p className="text-[13px] font-semibold tracking-[0.14em] text-primary">
              THIS ERA, SO FAR ♡
            </p>
            <h2 className="mt-1 font-display text-[20px] font-semibold">
              這段 Era，正在慢慢長大
            </h2>
            <div className="relative mt-5 pl-6">
              <span aria-hidden className="absolute bottom-2 left-[7px] top-2 w-px bg-primary/20" />
              <div className="space-y-5">
                {growth.map((item) => (
                  <div key={item.id} className="relative">
                    <span aria-hidden className="absolute top-2 -left-6 size-[15px] rounded-full border-2 border-primary/50 bg-card" />
                    <p className="text-[13px] font-medium tracking-[0.08em] text-muted-foreground">
                      {dotDate(item.date)} · {item.label}
                    </p>
                    <p className="mt-1 text-base font-medium">{item.title}</p>
                    {item.song ? (
                      <p className="mt-1 text-sm text-primary">♪ {item.song}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })() : null}

      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <p className="text-[13px] font-semibold tracking-[0.12em] text-muted-foreground">
            OUR DAYS
          </p>
          <h2 className="mt-1 font-display text-[19px] font-medium">
            一起走過的日子
          </h2>
        </div>
        {memories.length > 0 ? (
          <button
            onClick={() => {
              setEditing(null);
              setMemoryOpen(true);
            }}
            className="inline-flex items-center gap-1 min-h-11 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
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
              className="inline-flex items-center gap-1.5 min-h-[50px] rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
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
                          <p className="font-display text-[19px] font-medium">
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
          if (editing) {
            await updateMemory(editing.id, draft);
            setMemoryOpen(false);
            setEditing(null);
            toast.success("回憶更新好了 ♡");
          } else {
            const wasFirstMemory = memories.length === 0;
            await addMemory(folderId, draft, folder?.idolId);
            setMemoryOpen(false);
            setEditing(null);
            if (wasFirstMemory) {
              toast.success("第一則回憶收好了 ♡", {
                description: "這本回憶已經開始了，之後也可以送給一起追星的人。",
                action: {
                  label: "分享",
                  onClick: () => setShareOpen(true),
                },
                duration: 6500,
              });
            } else {
              toast.success("這一天收進回憶了 ♡");
            }
          }
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
