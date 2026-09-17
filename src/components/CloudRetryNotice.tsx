import { RefreshCw, WifiOff } from "lucide-react";

export function CloudRetryNotice({
  children,
  onRetry,
}: {
  children: React.ReactNode;
  onRetry: () => void;
}) {
  return (
    <div
      role="status"
      className="mb-4 flex items-center gap-3 rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-left text-xs text-muted-foreground"
    >
      <WifiOff className="size-4 shrink-0 text-primary" strokeWidth={1.8} />
      <p className="min-w-0 flex-1 leading-relaxed">{children}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-card px-3 py-1.5 font-medium text-primary shadow-soft transition-transform active:scale-95"
      >
        <RefreshCw className="size-3" strokeWidth={2} />
        重試
      </button>
    </div>
  );
}
