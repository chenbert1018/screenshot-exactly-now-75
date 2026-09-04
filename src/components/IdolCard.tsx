import { Link } from "@tanstack/react-router";
import { ImageIcon, Plus } from "lucide-react";
import type { Idol } from "@/lib/idols";

export function IdolCard({ idol }: { idol: Idol }) {
  return (
    <Link
      to="/idols/$idolId"
      params={{ idolId: idol.id }}
      className="group block overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition-all duration-300 active:scale-[0.98] hover:shadow-lift"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface">
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
      </div>
      <div className="px-3.5 pt-3 pb-3.5">
        <p className="truncate text-[15px] font-medium">{idol.name}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {idol.groupName || "　"}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
          <span>D-Day｜即將開放</span>
          <span>喜歡你 × — 天</span>
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
