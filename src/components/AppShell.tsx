import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="dreamy-bg paper-grain relative min-h-screen overflow-x-hidden bg-background">
      {/* 極克制的手帳裝飾 */}
      <span
        aria-hidden
        className="twinkle pointer-events-none absolute top-24 left-4 text-lg text-primary/40 select-none"
      >
        ✦
      </span>
      <span
        aria-hidden
        className="twinkle pointer-events-none absolute top-56 right-6 text-sm text-lavender select-none"
      >
        ☆
      </span>
      <span
        aria-hidden
        className="twinkle pointer-events-none absolute top-[38rem] left-8 text-sm text-accent select-none"
      >
        ♡
      </span>
      <div className="relative mx-auto min-h-screen w-full max-w-md px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-32">
        <main className="page-enter">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-7 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-[28px] leading-tight font-medium tracking-[0.01em]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}

export function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-[15px] font-medium tracking-[0.08em]">{title}</h2>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function SoftCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`cream-card transition-shadow duration-300 ${className}`}>
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <SoftCard className="px-6 py-10 text-center">
      {icon ? (
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-surface text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <p className="text-[15px] font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </SoftCard>
  );
}
