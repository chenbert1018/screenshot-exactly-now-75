import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { REMINDER_OFFSETS } from "@/lib/reminders";

export function ReminderSheet({
  open,
  onOpenChange,
  eventLabel,
  eventTitle,
  eventDate,
  initialOffsets,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventLabel: string;
  eventTitle: string;
  eventDate: string;
  initialOffsets: number[];
  onSave: (offsets: number[]) => void;
}) {
  const [selected, setSelected] = useState<number[]>(initialOffsets);

  useEffect(() => {
    if (open) setSelected(initialOffsets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggle(value: number) {
    setSelected((s) => (s.includes(value) ? s.filter((v) => v !== value) : [...s, value]));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-border/60 bg-card px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="px-0 text-left">
          <SheetTitle className="text-xl">設定提醒</SheetTitle>
          <SheetDescription>在重要日子之前提醒你。</SheetDescription>
        </SheetHeader>

        <div className="rounded-2xl bg-surface/60 px-4 py-3">
          <p className="text-xs text-muted-foreground">{eventLabel}</p>
          <p className="mt-0.5 text-[15px]">{eventTitle}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{eventDate}</p>
        </div>

        <p className="pt-4 pb-1 text-[15px] font-medium">提醒我</p>
        <ul className="space-y-2">
          {REMINDER_OFFSETS.map((o) => {
            const active = selected.includes(o.value);
            return (
              <li key={o.value}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(o.value)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-[15px] transition-colors ${
                    active
                      ? "border-primary/50 bg-primary/10 text-foreground"
                      : "border-border/70 bg-surface/40 text-muted-foreground"
                  }`}
                >
                  <span>{o.label}</span>
                  <span
                    className={`flex size-5 items-center justify-center rounded-full border ${
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    }`}
                  >
                    {active ? <Check className="size-3" strokeWidth={2.5} /> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex gap-3 pt-5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-full border border-border/70 py-3 text-sm transition-transform duration-300 active:scale-95"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => onSave(selected)}
            className="flex-1 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
          >
            儲存提醒
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
