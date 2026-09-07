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
          <img
            src={idol.photo}
            alt={`${idol.name} 的照片`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="size-6" strokeWidth={1.4} />
            <span className="text-[11px]">還沒有照片</span>
          </div>
        )}
        {day ? (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-medium text-primary shadow-soft backdrop-blur">
            {day.ddayLabel}
          </span>
        ) : null}
      </div>
      <div className="px-3.5 pt-3 pb-3.5">
        <p className="truncate text-[15px] font-medium">{idol.name}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{idol.groupName || "　"}</p>
        <div className="mt-3 space-y-1 border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
          <p className="truncate">
            {day ? `${day.title}・${day.humanLabel}` : "設定一個重要日子"}
          </p>
          <p className="truncate">
            {since ? since.humanLabel : "設定喜歡他的日期"}
          </p>
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
      className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/50 text-muted-foreground transition-transform duration-300 active:scale-[0.98]"
    >
      <Plus className="size-5" strokeWidth={1.6} />
      <span className="text-xs">加入偶像</span>
    </button>
  );
}
