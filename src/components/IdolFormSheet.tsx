import { StoredImage } from "@/components/StoredImage";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emptyDraft, type IdolDraft } from "@/lib/idols";

const fields: { key: keyof IdolDraft; label: string; type?: string }[] = [
  { key: "name", label: "偶像名稱" },
  { key: "groupName", label: "團體名稱" },
  { key: "birthday", label: "生日", type: "date" },
  { key: "debutDate", label: "出道日期", type: "date" },
  { key: "fanName", label: "粉絲名稱" },
  { key: "sinceDate", label: "我喜歡他的日期", type: "date" },
];

export function IdolFormSheet({
  open,
  onOpenChange,
  initial,
  title,
  submitLabel,
  onSubmit,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: IdolDraft;
  title: string;
  submitLabel: string;
  onSubmit: (draft: IdolDraft) => void;
  footer?: React.ReactNode;
}) {
  const [draft, setDraft] = useState<IdolDraft>(initial ?? emptyDraft);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setDraft(initial ?? emptyDraft);
      setError("");
    }
  }, [open, initial]);

  function pickPhoto(file?: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => ({ ...d, photo: String(reader.result ?? "") }));
    reader.readAsDataURL(file);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) {
      setError("請先幫這位偶像留下名字");
      return;
    }
    onSubmit({ ...draft, name: draft.name.trim() });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-border/60 bg-card px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="px-0 text-left">
          <SheetTitle className="text-xl">{title}</SheetTitle>
          <SheetDescription>只留下你想記得的部分就好</SheetDescription>
        </SheetHeader>

        <form onSubmit={submit} className="space-y-5 pt-2">
          <div>
            <p className="mb-2 text-sm font-medium">上傳偶像照片</p>
            {draft.photo ? (
              <div className="relative overflow-hidden rounded-2xl border border-border/60">
                <StoredImage src={draft.photo} alt="偶像照片預覽" className="aspect-[3/4] w-full object-cover" />
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
                className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/50 text-muted-foreground"
              >
                <ImagePlus className="size-6" strokeWidth={1.4} />
                <span className="text-sm">放一張你最喜歡的照片</span>
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

          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={f.key}>
                {f.label}
                {f.key === "name" ? <span className="ml-1 text-primary">*</span> : null}
              </Label>
              <Input
                id={f.key}
                type={f.type ?? "text"}
                value={draft[f.key]}
                onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                className="rounded-xl bg-surface/50"
              />
            </div>
          ))}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
          >
            {submitLabel}
          </button>
          {footer}
        </form>
      </SheetContent>
    </Sheet>
  );
}
