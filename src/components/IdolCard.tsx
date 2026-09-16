import { StoredImage } from "@/components/StoredImage";
import { Link } from "@tanstack/react-router";
import { Check, Home, ImageIcon, Plus } from "lucide-react";
import type { Idol } from "@/lib/idols";
import { daysSince, primaryDay } from "@/lib/dates";

export function IdolCard({
  idol,
  isMain = false,
  onSetMain,
}: {
  idol: Idol;
  isMain?: boolean;
  onSetMain?: () => void;
}) {
  const day = primaryDay(idol);
  const since = daysSince(idol.sinceDate);

  return (
    <article className="polaroid relative">
    <Link
      to="/idols/$idolId"
      params={{ idolId: idol.id }}
      className="group block transition-all duration-300 active:scale-[0.98] hover:shadow-lift"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[0.6rem] bg-surface">
        {idol.photo ? (
          <StoredImage
            src={idol.photo}
            alt={`${idol.name} 的照片`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            style={{ objectPosition: `50% ${idol.photoPosition ?? 50}%` }}
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="size-6" strokeWidth={1.4} />
            <span className="text-[13px]">還沒有照片</span>
          </div>
        )}
        {day ? (
          <span className="font-display absolute top-2.5 left-2.5 rounded-full bg-card/90 px-2.5 py-1 text-[13px] text-primary shadow-soft backdrop-blur">
            {day.ddayLabel}
          </span>
        ) : null}
        <span
          aria-hidden
          className="absolute top-2 right-2.5 text-[13px] text-primary/70 select-none"
        >
          ♡
        </span>
      </div>
      <div className="px-1.5 pt-2.5">
        <p className="font-display truncate text-[18px] font-bold">{idol.name}</p>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
          {idol.groupName || "　"}
        </p>
        <div className="mt-2 space-y-0.5 text-[13px] text-muted-foreground">
          <p className="truncate">{day ? `${day.title}・${day.humanLabel}` : "設定一個重要日子"}</p>
          <p className="truncate">{since ? since.humanLabel : "設定喜歡他的日期"}</p>
        </div>
      </div>
    </Link>
    {onSetMain ? (
      <button
        type="button"
        onClick={onSetMain}
        disabled={isMain}
        className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-[12px] font-medium transition-colors ${
          isMain
            ? "border-primary/30 bg-primary/12 text-primary"
            : "border-border/80 bg-card text-foreground hover:border-primary/40"
        }`}
      >
        {isMain ? <Check className="size-3.5" /> : <Home className="size-3.5" />}
        {isMain ? "首頁封面" : "設為首頁封面"}
      </button>
    ) : null}
    </article>
  );
}

export function EmptySlot({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-[1rem] border border-dashed border-primary/30 bg-surface/40 text-muted-foreground transition-transform duration-300 active:scale-[0.98]"
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-accent/40 text-primary">
        <Plus className="size-4" strokeWidth={1.8} />
      </span>
      <span className="text-[13px]">加入本命 ♡</span>
    </button>
  );
}
