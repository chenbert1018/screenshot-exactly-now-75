import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
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
import { emptyHeartDraft, HEART_TYPES, type HeartDraft } from "@/lib/heart";
import type { Idol } from "@/lib/idols";
import { StoredImage } from "@/components/StoredImage";

function todayValue() {
  const n = new Date();
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}

export function HeartFormSheet({
  open,
  onOpenChange,
  idols,
  initial,
  defaultIdolId,
  title,
  submitLabel,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idols: Idol[];
  initial?: HeartDraft | undefined;
  defaultIdolId?: string | undefined;
  title: string;
  submitLabel: string;
  onSubmit: (draft: HeartDraft) => void;
}) {
  const [draft, setDraft] = useState<HeartDraft>(emptyHeartDraft);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(
      initial ?? {
        ...emptyHeartDraft,
        date: todayValue(),
        idolId: defaultIdolId ?? idols[0]?.id ?? "",
      },
    );
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function pickPhoto(file?: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => ({ ...d, image: String(reader.result ?? "") }));
    reader.readAsDataURL(file);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.idolId) return setError("請選擇一位偶像");
    if (!draft.title.trim()) return setError("幫這個瞬間取一個名字");
    if (!draft.date) return setError("請選擇日期");
    onSubmit({ ...draft, title: draft.title.trim() });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92vh] w-full max-w-md overflow-x-hidden overflow-y-auto rounded-t-3xl border-border/60 bg-card px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="px-0 text-left">
          <SheetTitle className="text-xl">{title}</SheetTitle>
          <SheetDescription>收藏那些讓我嗑到的瞬間 ♡</SheetDescription>
        </SheetHeader>

        <form onSubmit={submit} className="space-y-5 pt-1">
          <div>
            <p className="mb-2 text-sm font-medium">
              偶像<span className="ml-1 text-primary">*</span>
            </p>
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
              {idols.map((idol) => {
                const active = draft.idolId === idol.id;
                return (
                  <button
                    key={idol.id}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, idolId: idol.id }))}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
                      active
                        ? "border-primary/50 bg-accent/50 text-primary"
                        : "border-border/70 text-muted-foreground"
                    }`}
                  >
                    {idol.name || "未命名"}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">照片</p>
            {draft.image ? (
              <div className="relative overflow-hidden rounded-2xl border border-border/60">
                <StoredImage src={draft.image} alt="嗑糖照片預覽" className="aspect-[4/3] w-full object-cover" />
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
                    onClick={() => setDraft((d) => ({ ...d, image: "" }))}
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
                className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/50 text-muted-foreground"
              >
                <ImagePlus className="size-6" strokeWidth={1.4} />
                <span className="text-sm">放一張讓你嗑到的照片（可略過）</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                pickPhoto(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="heart-title">
              標題<span className="ml-1 text-primary">*</span>
            </Label>
            <Input
              id="heart-title"
              value={draft.title}
              placeholder="例如：那個轉身的瞬間"
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="rounded-xl bg-surface/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="heart-date">
              日期<span className="ml-1 text-primary">*</span>
            </Label>
            <Input
              id="heart-date"
              type="date"
              value={draft.date}
              onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
              className="rounded-xl bg-surface/50"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">
              類型<span className="ml-1 text-primary">*</span>
            </p>
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
              {HEART_TYPES.map((t) => {
                const active = draft.type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, type: t.value }))}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
                      active
                        ? "border-primary/50 bg-accent/50 text-primary"
                        : "border-border/70 text-muted-foreground"
                    }`}
                  >
                    <span aria-hidden className="mr-1">
                      {t.emoji}
                    </span>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="heart-note">心情筆記</Label>
            <Textarea
              id="heart-note"
              rows={4}
              value={draft.note}
              placeholder="看到這一幕的時候⋯"
              onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
              className="rounded-xl bg-surface/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="heart-link">連結（可選）</Label>
            <Input
              id="heart-link"
              value={draft.link}
              placeholder="https://"
              onChange={(e) => setDraft((d) => ({ ...d, link: e.target.value }))}
              className="rounded-xl bg-surface/50"
            />
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
              className="flex-1 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
