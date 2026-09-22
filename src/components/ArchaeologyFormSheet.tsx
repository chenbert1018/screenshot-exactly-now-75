import { useEffect, useRef, useState } from "react";
import { ImagePlus, Link2, Plus, X } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { prepareUserImage } from "@/lib/image-upload";

import {
  detectArchaeologySource,
  emptyArchaeologyDraft,
  type ArchaeologyDraft,
  type ArchaeologySource,
} from "@/lib/archaeology";

type LinkPreviewResponse = {
  ok: boolean;
  title?: string;
  imageUrl?: string;
  description?: string;
  siteName?: string;
  error?: string;
};

const SOURCE_LABELS: Record<ArchaeologySource, string> = {
  THREADS: "Threads",
  X: "X",
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  WEB: "網頁",
};

function getYouTubeVideoId(value: string) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v") || "";
      }

      const parts = url.pathname.split("/").filter(Boolean);

      if (parts[0] && ["shorts", "embed", "live"].includes(parts[0])) {
        return parts[1] || "";
      }
    }
  } catch {
    return "";
  }

  return "";
}

function getYouTubeThumbnail(value: string) {
  const videoId = getYouTubeVideoId(value);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
}

export function ArchaeologyFormSheet({
  open,
  onOpenChange,
  initial,
  title = "留下這個寶藏",
  submitLabel = "收進 IdolDays",
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ArchaeologyDraft | undefined;
  title?: string;
  submitLabel?: string;
  onSubmit: (draft: ArchaeologyDraft) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<ArchaeologyDraft>(emptyArchaeologyDraft);
  const [saving, setSaving] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");
  const [previewState, setPreviewState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    setDraft(
      initial
        ? {
            ...initial,
            tags: [...initial.tags],
          }
        : {
            ...emptyArchaeologyDraft,
            tags: [],
          },
    );
    setTagInput("");
    setError("");
    setSaving(false);
    setPreviewState("idle");
    setMoreOpen(Boolean(initial?.imageUrl || initial?.collection || initial?.tags.length || initial?.note));
  }, [open, initial]);

  const source = draft.url.trim() ? detectArchaeologySource(draft.url) : null;

  useEffect(() => {
    if (!open) return;

    const value = draft.url.trim();

    if (!value) {
      setPreviewState("idle");
      return;
    }

    try {
      const parsed = new URL(value);

      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        setPreviewState("idle");
        return;
      }
    } catch {
      setPreviewState("idle");
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setPreviewState("loading");

      try {
        const response = await fetch(`/api/link-preview?url=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        });

        const data = (await response.json()) as LinkPreviewResponse;

        if (!response.ok || !data.ok) {
          throw new Error(data.error || "preview failed");
        }

        setDraft((current) => {
          if (current.url.trim() !== value) {
            return current;
          }

          const source = detectArchaeologySource(value);

          const threadsTitle =
            source === "THREADS"
              ? data.description
                  ?.split(/\r?\n/)
                  .map((line) => line.trim())
                  .find(Boolean) || ""
              : "";

          const previewImageUrl = data.imageUrl?.trim() || "";

          return {
            ...current,

            // Threads 優先用貼文內容，而不是「作者 (@id) on Threads」
            title: current.title.trim() || threadsTitle || data.title?.trim() || "",

            // 不覆蓋手動封面，也不覆蓋 YouTube 自動縮圖
            imageUrl: current.imageUrl?.trim() || previewImageUrl,
          };
        });

        setPreviewState("done");
      } catch (previewError) {
        if (previewError instanceof Error && previewError.name === "AbortError") {
          return;
        }

        setPreviewState("error");
      }
    }, 650);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, draft.url]);

  function addTag() {
    const value = tagInput.trim().replace(/^#/, "");

    if (!value) return;

    if (!draft.tags.includes(value)) {
      setDraft((current) => ({
        ...current,
        tags: [...current.tags, value],
      }));
    }

    setTagInput("");
  }

  function removeTag(tag: string) {
    setDraft((current) => ({
      ...current,
      tags: current.tags.filter((item) => item !== tag),
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const url = draft.url.trim();
    const itemTitle = draft.title.trim();

    if (!url) {
      setError("貼上你想收藏的原文連結");
      return;
    }

    try {
      const parsed = new URL(url);

      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("invalid");
      }
    } catch {
      setError("請貼上完整的原文連結");
      return;
    }

    if (!itemTitle) {
      setError("替這個瞬間留一個名字");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSubmit({
        ...draft,
        url,
        title: itemTitle,
        imageUrl: draft.imageUrl?.trim() || "",
        collection: draft.collection.trim(),
        note: draft.note.trim(),
      });
    } catch {
      setError("這個寶藏還沒有存好，請確認網路後再試一次");
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
          <SheetTitle className="text-[22px]">{title}</SheetTitle>

          <SheetDescription>貼連結，就收進考古 ♡</SheetDescription>
        </SheetHeader>

        <form onSubmit={submit} className="space-y-5 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="archaeology-url">
              原文連結
              <span className="ml-1 text-primary">*</span>
            </Label>

            <div className="relative">
              <Link2
                className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.6}
              />

              <Input
                id="archaeology-url"
                type="url"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                value={draft.url}
                placeholder="貼上 Threads、X、YouTube..."
                onChange={(e) => {
                  const nextUrl = e.target.value;
                  const youtubeThumbnail = getYouTubeThumbnail(nextUrl);

                  setDraft((current) => ({
                    ...current,
                    url: nextUrl,
                    imageUrl:
                      youtubeThumbnail && !current.imageUrl?.trim()
                        ? youtubeThumbnail
                        : current.imageUrl,
                  }));

                  setError("");
                }}
                className="min-h-12 rounded-2xl bg-surface/50 pl-10"
              />
            </div>

            {source ? (
              <p className="text-sm text-muted-foreground">來源：{SOURCE_LABELS[source]}</p>
            ) : null}

            {previewState === "loading" ? (
              <p className="text-sm text-muted-foreground">正在讀取連結預覽…</p>
            ) : null}

            {previewState === "error" ? (
              <p className="text-sm text-muted-foreground">
                讀不到預覽也沒關係，可以手動填寫標題與封面。
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="archaeology-title">
              標題
              <span className="ml-1 text-primary">*</span>
            </Label>

            <Input
              id="archaeology-title"
              value={draft.title}
              placeholder="例如：這篇入坑整理超完整"
              onChange={(e) => {
                setDraft((current) => ({
                  ...current,
                  title: e.target.value,
                }));
                setError("");
              }}
              className="min-h-12 rounded-2xl bg-surface/50"
            />
          </div>

          <button type="button" onClick={() => setMoreOpen((value) => !value)} className="flex min-h-11 w-full items-center justify-between rounded-2xl bg-surface/50 px-4 text-sm text-muted-foreground"><span>＋ 封面・收藏集・標籤・小記</span><span aria-hidden>{moreOpen ? "−" : "＋"}</span></button>
          {moreOpen ? <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="archaeology-image">封面圖</Label>
            <Input
              id="archaeology-image"
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              value={draft.imageUrl ?? ""}
              placeholder="貼上圖片網址（選填）"
              onChange={(e) =>
                setDraft((current) => ({
                  ...current,
                  imageUrl: e.target.value,
                }))
              }
              className="min-h-12 rounded-2xl bg-surface/50"
            />
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                void prepareUserImage(file)
                  .then((imageUrl) => setDraft((current) => ({ ...current, imageUrl })))
                  .catch(() => setError("封面圖片讀取失敗，請換一張圖片再試"));
              }}
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/8 min-h-[50px] px-4 py-3 text-base font-medium text-primary"
            >
              <ImagePlus className="size-4" strokeWidth={1.7} />
              從相簿選擇影片截圖
            </button>
            {draft.imageUrl?.trim() ? (
              <div className="overflow-hidden rounded-2xl border border-border/50 bg-surface/40">
                <img
                  src={draft.imageUrl.trim()}
                  alt="封面預覽"
                  className="aspect-[16/9] w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ) : null}

          </div>

          <div className="space-y-1.5">
            <Label htmlFor="archaeology-collection">收藏集</Label>

            <Input
              id="archaeology-collection"
              value={draft.collection}
              placeholder="例如：入坑必看、經典舞台"
              onChange={(e) =>
                setDraft((current) => ({
                  ...current,
                  collection: e.target.value,
                }))
              }
              className="min-h-12 rounded-2xl bg-surface/50"
            />

            
          </div>

          <div className="space-y-2">
            <Label htmlFor="archaeology-tag">標籤</Label>

            {draft.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {draft.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="flex items-center gap-1 min-h-11 rounded-full bg-surface px-3 py-2 text-sm"
                  >
                    #{tag}
                    <X className="size-3" strokeWidth={1.8} />
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex gap-2">
              <Input
                id="archaeology-tag"
                value={tagInput}
                placeholder="糖點、名場面、CP..."
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="min-h-12 rounded-2xl bg-surface/50"
              />

              <button
                type="button"
                onClick={addTag}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface text-muted-foreground"
                aria-label="加入 Tag"
              >
                <Plus className="size-4" strokeWidth={1.8} />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="archaeology-note">我的備註</Label>

            <Textarea
              id="archaeology-note"
              rows={4}
              value={draft.note}
              placeholder="例如：03:21 那段一定要看"
              onChange={(e) =>
                setDraft((current) => ({
                  ...current,
                  note: e.target.value,
                }))
              }
              className="min-h-12 rounded-2xl bg-surface/50"
            />
          </div>


          </div> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="min-h-[50px] rounded-full px-4 py-3 text-base text-muted-foreground transition-transform active:scale-95"
            >
              取消
            </button>

            <button
              type="submit"
              disabled={saving}
              className="min-h-[52px] flex-1 rounded-full bg-primary py-3 text-base font-medium text-primary-foreground shadow-soft transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? "儲存中…" : submitLabel}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
