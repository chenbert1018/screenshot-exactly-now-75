import { StoredImage } from "@/components/StoredImage";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { heartTypeLabel, type HeartItem } from "@/lib/heart";
import { parseLocalDate } from "@/lib/dates";

const pad = (n: number) => String(n).padStart(2, "0");

/** 2026.09.04 */
export function dotDate(value: string) {
  const p = parseLocalDate(value);
  if (!p) return "";
  return `${p.y}.${pad(p.m)}.${pad(p.d)}`;
}

export function SugarPlaceholder({ item, name }: { item: HeartItem; name: string }) {
  return (
    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-surface/60">
      <span className="flex size-12 items-center justify-center rounded-full bg-accent/50 font-display text-lg text-primary">
        {name.slice(0, 1) || "♡"}
      </span>
      <span className="text-xs tracking-[0.2em] text-muted-foreground">
        {heartTypeLabel(item.type)}
      </span>
    </div>
  );
}

export function HeartDetailSheet({
  item,
  idolName,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  item: HeartItem | null;
  idolName: string;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Sheet open={!!item} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92vh] w-full max-w-md overflow-x-hidden overflow-y-auto rounded-t-3xl border-border/60 bg-card px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        {item ? (
          <>
            <SheetHeader className="px-0 text-left">
              <SheetTitle className="sr-only">{item.title}</SheetTitle>
              <SheetDescription className="sr-only">這顆糖的細節</SheetDescription>
            </SheetHeader>

            <div className="overflow-hidden rounded-2xl border border-border/60">
              {item.image ? (
                <StoredImage
                  src={item.image}
                  alt={item.title}
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <SugarPlaceholder item={item} name={idolName} />
              )}
            </div>

            <span className="mt-5 inline-flex rounded-full bg-surface px-3 py-1 text-[11px] text-muted-foreground">
              {heartTypeLabel(item.type)}
            </span>
            <h2 className="mt-2 font-display text-[22px] leading-snug">{item.title}</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              {dotDate(item.date)}・{idolName}
            </p>

            {item.note ? (
              <p className="mt-4 rounded-2xl bg-surface/60 px-4 py-4 text-sm leading-relaxed whitespace-pre-wrap">
                {item.note}
              </p>
            ) : null}

            {item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center gap-2 rounded-2xl border border-border/60 px-4 py-3 text-sm break-all text-primary"
              >
                <ExternalLink className="size-4 shrink-0" strokeWidth={1.6} />
                {item.link}
              </a>
            ) : null}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onEdit}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border/70 py-3 text-sm transition-transform duration-300 active:scale-95"
              >
                <Pencil className="size-4" strokeWidth={1.6} />
                編輯
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-destructive/30 py-3 text-sm text-destructive transition-transform duration-300 active:scale-95"
              >
                <Trash2 className="size-4" strokeWidth={1.6} />
                刪除
              </button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
