import { StoredImage } from "@/components/StoredImage";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, ImagePlus, Music2, Plus, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { emptyMemoryDraft, type MemoryDraft } from "@/lib/memories";
import { prepareUserImage } from "@/lib/image-upload";
import type { IdolSong, IdolSongDraft } from "@/lib/idol-music";
import { IdolSongFormSheet } from "@/components/IdolSongFormSheet";

function todayValue() {
  const n = new Date();
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}

export function MemoryFormSheet({
  open,
  onOpenChange,
  initial,
  title,
  submitLabel,
  onSubmit,
  songs = [],
  addSong,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: MemoryDraft | undefined;
  title: string;
  submitLabel: string;
  onSubmit: (draft: MemoryDraft) => void | Promise<void>;
  songs?: IdolSong[];
  addSong?: (draft: IdolSongDraft) => Promise<IdolSong>;
}) {
  const [draft, setDraft] = useState<MemoryDraft>(emptyMemoryDraft);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [songPickerOpen, setSongPickerOpen] = useState(false);
  const [addSongOpen, setAddSongOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedSong = songs.find((song) => song.id === draft.songId);

  async function createAndChooseSong(songDraft: IdolSongDraft) {
    if (!addSong) {
      setError("目前無法新增歌曲，請稍後再試");
      return;
    }

    try {
      setError("");
      const song = await addSong(songDraft);
      setDraft((d) => ({ ...d, songId: song.id }));
      setSongPickerOpen(false);
    } catch (error) {
      console.error("[IdolDays memory song create]", error);
      setError("歌曲沒有新增成功，請稍後再試一次");
    }
  }

  useEffect(() => {
    if (open) {
      setDraft(initial ?? { ...emptyMemoryDraft, date: todayValue() });
      setError("");
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function pickPhoto(file?: File | null) {
    if (!file) return;
    setError("");

    try {
      const photo = await prepareUserImage(file);
      setDraft((d) => ({ ...d, photo }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "照片讀取失敗，請換一張再試");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) return setError("幫這段回憶取一個名字");
    if (!draft.date) return setError("請選擇日期");

    setSaving(true);
    setError("");

    try {
      await onSubmit({ ...draft, title: draft.title.trim() });
    } catch {
      setError("回憶沒有儲存成功，請確認網路後再試一次");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border-border/60 bg-card px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="px-0 text-left">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-primary">
            OUR MEMORIES ♡
          </p>
          <SheetTitle className="font-display text-[22px]">{title}</SheetTitle>
          <SheetDescription>把這一天的心情寫下來 ♡</SheetDescription>
        </SheetHeader>

        <form onSubmit={submit} className="space-y-5 pt-1">
          <div>
            <p className="mb-2 text-sm font-medium">照片</p>
            {draft.photo ? (
              <div className="relative overflow-hidden rounded-[1.75rem] border border-border/60">
                <StoredImage src={draft.photo} alt="回憶照片預覽" className="aspect-[4/3] w-full object-cover" />
                <div className="absolute right-3 bottom-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="rounded-full bg-card/90 px-3 py-1.5 text-xs shadow-soft"
                  >
                    重新選擇
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, photo: "" }))}
                    className="rounded-full bg-card/90 p-1.5 shadow-soft"
                    aria-label="移除照片"
                  >
                    <X className="size-4" strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-[1.75rem] border border-dashed border-border bg-surface/50 text-muted-foreground"
              >
                <ImagePlus className="size-6" strokeWidth={1.4} />
                <span className="text-sm">放一張那天的照片（可略過）</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void pickPhoto(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="memory-title">
              標題<span className="ml-1 text-primary">*</span>
            </Label>
            <Input
              id="memory-title"
              value={draft.title}
              placeholder="例如：演唱會 Day 1"
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="min-h-11 rounded-2xl border-border/70 bg-surface/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="memory-date">日期</Label>
            <Input
              id="memory-date"
              type="date"
              value={draft.date}
              onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
              className="min-h-11 rounded-2xl border-border/70 bg-surface/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="memory-note">心得</Label>
            <Textarea
              id="memory-note"
              rows={4}
              value={draft.note}
              placeholder="今天真的見到他了⋯"
              onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
              className="min-h-11 rounded-2xl border-border/70 bg-surface/50"
            />
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.14em] text-primary">
                THIS DAY'S SOUNDTRACK ♡
              </p>

              <Label className="mt-1 block">這一天的歌</Label>

              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                有沒有一首歌，會讓你想起這一天？
              </p>
            </div>

            {selectedSong ? (
              <div className="memory-soundtrack-moment">
                <div
                  className="memory-soundtrack-moment-disc"
                  aria-hidden="true"
                >
                  <span className="memory-soundtrack-moment-hole" />
                  <span className="memory-soundtrack-moment-note">
                    ♪
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="memory-soundtrack-moment-label">
                    OUR MEMORY SONG
                  </p>

                  <p className="memory-soundtrack-moment-title">
                    {selectedSong.title}
                  </p>

                  {selectedSong.artist ? (
                    <p className="memory-soundtrack-moment-artist">
                      {selectedSong.artist}
                    </p>
                  ) : null}
                </div>

                <span
                  className="memory-soundtrack-moment-heart"
                  aria-hidden="true"
                >
                  ♡
                </span>
              </div>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSongPickerOpen(true)}
                className="memory-soundtrack-picker flex min-h-12 flex-1 items-center justify-between gap-3 rounded-2xl border border-input bg-surface/50 px-4 py-3 text-left transition-transform duration-300 active:scale-[0.99]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Music2
                    className="size-4 shrink-0 text-primary"
                    strokeWidth={1.7}
                  />

                  <span className="text-sm">
                    {selectedSong ? "更換歌曲" : "＋ 選一首歌"}
                  </span>
                </span>

                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground"
                  strokeWidth={1.7}
                />
              </button>

              {selectedSong ? (
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      songId: "",
                    }))
                  }
                  className="memory-soundtrack-remove min-h-12 rounded-2xl border border-border/70 px-4 text-xs text-muted-foreground"
                >
                  移除
                </button>
              ) : null}
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              選填。留下來之後，這首歌也會一起進入你的音樂日記。
            </p>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-full border border-border/70 py-3 text-sm transition-transform duration-300 active:scale-95"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95 disabled:opacity-60"
            >
              {saving ? "儲存中…" : submitLabel}
            </button>
          </div>
        </form>
      </SheetContent>

      <Sheet open={songPickerOpen} onOpenChange={setSongPickerOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[78vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border-border/60 bg-card px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="px-0 text-left">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-primary">
              OUR MEMORIES ♡
            </p>

            <SheetTitle className="font-display text-[22px]">
              選擇這天的歌 ♡
            </SheetTitle>

            <SheetDescription>
              把那一天和一首歌留在一起。
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setDraft((d) => ({ ...d, songId: "" }));
                setSongPickerOpen(false);
              }}
              className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-border/70 bg-surface/40 px-4 py-3 text-left"
            >
              <span className="text-sm">不綁定歌曲</span>

              {!draft.songId ? (
                <span className="text-xs font-semibold text-primary">
                  SELECTED ♡
                </span>
              ) : null}
            </button>

            {songs.map((song) => {
              const active = draft.songId === song.id;

              return (
                <button
                  key={song.id}
                  type="button"
                  onClick={() => {
                    setDraft((d) => ({ ...d, songId: song.id }));
                    setSongPickerOpen(false);
                  }}
                  className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface/40 px-4 py-3 text-left"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Music2
                      className="size-4 shrink-0 text-primary"
                      strokeWidth={1.7}
                    />

                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {song.title}
                      </span>

                      {song.artist ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {song.artist}
                        </span>
                      ) : null}
                    </span>
                  </span>

                  {active ? (
                    <span className="shrink-0 text-xs font-semibold text-primary">
                      THIS DAY ♡
                    </span>
                  ) : null}
                </button>
              );
            })}

            {songs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 px-4 py-5 text-center">
                <p className="text-sm text-muted-foreground">
                  還沒有收藏歌曲 ♡
                </p>
              </div>
            ) : null}

            {addSong ? (
              <button
                type="button"
                onClick={() => {
                  setSongPickerOpen(false);
                  setAddSongOpen(true);
                }}
                className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
              >
                <Plus className="size-4" strokeWidth={1.8} />
                新增歌曲
              </button>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      {addSong ? (
        <IdolSongFormSheet
          open={addSongOpen}
          onOpenChange={setAddSongOpen}
          onSubmit={createAndChooseSong}
        />
      ) : null}
    </Sheet>
  );
}
