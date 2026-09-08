import { StoredImage } from "@/components/StoredImage";
import { Link } from "@tanstack/react-router";
import { ImageIcon, Plus } from "lucide-react";
import type { Idol } from "@/lib/idols";
import { daysSince, primaryDay } from "@/lib/dates";

export function IdolCard({ idol }: { idol: Idol }) {
  const day = primaryDay(idol);
  const since = daysSince(idol.sinceDate);

  return (
    <Link
      to="/idols/$idolId"
      params={{ idolId: idol.id }}
      className="group polaroid block transition-all duration-300 active:scale-[0.98] hover:shadow-lift"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[0.6rem] bg-surface">
        {idol.photo ? (
          <StoredImage
            src={idol.photo}
            alt={`${idol.name} 的照片`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
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
        <p className="font-display truncate text-[15px]">{idol.name}</p>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
          {idol.groupName || "　"}
        </p>
        <div className="mt-2 space-y-0.5 text-[13px] text-muted-foreground">
          <p className="truncate">{day ? `${day.title}・${day.humanLabel}` : "設定一個重要日子"}</p>
          <p className="truncate">{since ? since.humanLabel : "設定喜歡他的日期"}</p>
        </div>
      </div>
    </Link>
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
