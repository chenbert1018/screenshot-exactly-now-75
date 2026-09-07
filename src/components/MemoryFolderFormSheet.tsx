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
import { emptyFolderDraft, type MemoryFolderDraft } from "@/lib/memory-folders";
import { useIdols } from "@/lib/idols";

export function MemoryFolderFormSheet({
  open,
  onOpenChange,
  initial,
  title,
  submitLabel,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: MemoryFolderDraft | undefined;
  title: string;
  submitLabel: string;
  onSubmit: (draft: MemoryFolderDraft) => void;
}) {
  const { idols } = useIdols();
  const [draft, setDraft] = useState<MemoryFolderDraft>(emptyFolderDraft);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setDraft(initial ?? emptyFolderDraft);
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function pickPhoto(file?: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => ({ ...d, coverPhoto: String(reader.result ?? "") }));
    reader.readAsDataURL(file);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) return setError("幫這個資料夾取一個名字");
    onSubmit({ ...draft, title: draft.title.trim() });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-border/60 bg-card px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="px-0 text-left">
          <SheetTitle className="text-xl">{title}</SheetTitle>
          <SheetDescription>把一段時光收在同一個地方 ♡</SheetDescription>
        </SheetHeader>

        <form onSubmit={submit} className="space-y-5 pt-1">
          <div>
            <p className="mb-2 text-sm font-medium">封面照片</p>
            {draft.coverPhoto ? (
              <div className="relative overflow-hidden rounded-2xl border border-border/60">
                <img src={draft.coverPhoto} alt="封面預覽" className="aspect-[4/3] w-full object-cover" />
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
                    onClick={() => setDraft((d) => ({ ...d, coverPhoto: "" }))}
                    className="rounded-full bg-card/90 p-1.5 shadow-soft"
                    aria-label="移除封面"
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
                <span className="text-sm">選一張代表這段回憶的照片</span>
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
            <Label htmlFor="folder-title">
              資料夾名稱<span className="ml-1 text-primary">*</span>
            </Label>
            <Input
              id="folder-title"
              value={draft.title}
              placeholder="例如：2026 巡迴演唱會"
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="rounded-xl bg-surface/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="folder-desc">描述</Label>
            <Input
              id="folder-desc"
              value={draft.description}
              placeholder="想留給自己的一句話"
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              className="rounded-xl bg-surface/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="folder-start">開始日期</Label>
              <Input
                id="folder-start"
                type="date"
                value={draft.startDate}
                onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                className="rounded-xl bg-surface/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="folder-end">結束日期</Label>
              <Input
                id="folder-end"
                type="date"
                value={draft.endDate}
                onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                className="rounded-xl bg-surface/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>關聯偶像</Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, idolId: "" }))}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  draft.idolId === "" ? "border-primary bg-primary/10" : "border-border/70 bg-surface/40"
                }`}
              >
                不指定
              </button>
              {idols.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, idolId: i.id }))}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                    draft.idolId === i.id
                      ? "border-primary bg-primary/10"
                      : "border-border/70 bg-surface/40"
                  }`}
                >
                  {i.name}
                </button>
              ))}
            </div>
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
