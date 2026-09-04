import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MILESTONE_EMOJIS,
  emptyMilestoneDraft,
  type MilestoneDraft,
} from "@/lib/milestones";

export function MilestoneFormSheet({
  open,
  onOpenChange,
  initial,
  defaultDate,
  title,
  submitLabel,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: MilestoneDraft | undefined;
  defaultDate?: string;
  title: string;
  submitLabel: string;
  onSubmit: (draft: MilestoneDraft) => void;
}) {
  const [draft, setDraft] = useState<MilestoneDraft>(emptyMilestoneDraft);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      const base = initial ?? { ...emptyMilestoneDraft, date: defaultDate ?? "" };
      setDraft(base);
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) return setError("幫這個里程碑取一個名字");
    if (!draft.date) return setError("請選擇日期");
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
          <SheetDescription>把準備這一天的小瞬間留下來</SheetDescription>
        </SheetHeader>

        <form onSubmit={submit} className="space-y-5 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="milestone-title">里程碑名稱</Label>
            <Input
              id="milestone-title"
              value={draft.title}
              placeholder="例如：搶票成功"
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="rounded-xl bg-surface/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="milestone-date">日期</Label>
            <Input
              id="milestone-date"
              type="date"
              value={draft.date}
              onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
              className="rounded-xl bg-surface/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Emoji</Label>
            <div className="flex flex-wrap gap-2">
              {MILESTONE_EMOJIS.map((emoji) => {
                const active = draft.emoji === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, emoji }))}
                    className={`flex size-11 items-center justify-center rounded-full border text-lg transition-colors ${
                      active ? "border-primary bg-primary/10" : "border-border/70 bg-surface/40"
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
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
