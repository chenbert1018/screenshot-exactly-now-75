import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { User } from "lucide-react";
import { BottomNav } from "./BottomNav";


export function AppShell({
  children,
  showProfileShortcut = true,
}: {
  children: ReactNode;
  showProfileShortcut?: boolean;
}) {
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
      <div className="relative mx-auto min-h-screen w-full max-w-md px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[calc(7rem+env(safe-area-inset-bottom))]">
        {showProfileShortcut ? (
          <div className="mb-3 flex justify-end">
            <Link
              to="/profile"
              aria-label="我的"
              className="flex size-9 items-center justify-center rounded-full border border-border/60 bg-card/70 text-muted-foreground backdrop-blur transition-transform duration-300 active:scale-95"
              activeProps={{ className: "text-primary" }}
            >
              <User className="size-4" strokeWidth={1.6} />
            </Link>
          </div>
        ) : null}
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
        <h1 className="font-display text-[24px] leading-snug font-bold tracking-[0.01em]">
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
        <h2 className="font-display text-[17px] font-semibold tracking-[0.04em]">{title}</h2>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function SoftCard({
  children,
  className = "",
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      {...props}
      className={`cream-card transition-shadow duration-300 ${className}`}
    >
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
    <SoftCard className="relative overflow-hidden px-6 py-11 text-center">
      <span aria-hidden className="pointer-events-none absolute top-4 left-5 text-primary/25 select-none">
        ♡
      </span>
      <span aria-hidden className="pointer-events-none absolute right-6 bottom-5 text-lavender select-none">
        ✦
      </span>
      {icon ? (
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent/40 text-primary">
          {icon}
        </div>
      ) : null}
      <p className="font-display text-[16px] text-foreground">{title}</p>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </SoftCard>
  );
}


export function AppButton({
  children,
  variant = "primary",
  className = "",
  type = "button",
  disabled = false,
  onClick,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
}) {
  const variants = {
    primary:
      "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90",
    secondary:
      "border border-border/70 bg-card/75 text-foreground backdrop-blur hover:bg-accent/30",
    ghost:
      "bg-transparent text-muted-foreground hover:bg-accent/30 hover:text-foreground",
    danger:
      "bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium transition-all duration-300 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
