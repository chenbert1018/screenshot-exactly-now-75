import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkAdmin } from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth";

const NAV = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/idols", label: "Idols" },
  { to: "/admin/events", label: "Events" },
  { to: "/admin/memories", label: "Memories" },
  { to: "/admin/sugar", label: "嗑糖" },
  { to: "/admin/reminders", label: "Reminders" },
  { to: "/admin/widget", label: "Widget" },
] as const;

/** Admin Console 外框：左側（桌機）／上方橫向（手機）導覽 + 權限守門 */
export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const { user, loading } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const check = useServerFn(checkAdmin);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-check", user?.id ?? null],
    queryFn: () => check(),
    enabled: Boolean(user),
    retry: false,
  });

  const gate = !user ? "anon" : isLoading || loading ? "loading" : data?.isAdmin ? "ok" : "denied";

  return (
    <div className="min-h-dvh bg-surface/40 text-foreground">
      <header className="border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur">
        <p className="text-[15px] font-semibold tracking-tight">IdolDays Admin</p>
        <p className="text-xs text-muted-foreground">管理後台</p>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col md:flex-row">
        <nav className="flex gap-1 overflow-x-auto border-b border-border/60 px-3 py-2 md:w-48 md:shrink-0 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:py-4">
          {NAV.map((item) => {
            const active = path === item.to || (item.to !== "/admin" && path.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`shrink-0 rounded-xl px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-surface"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            to="/"
            className="mt-1 shrink-0 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-surface md:mt-4"
          >
            ← 回 App
          </Link>
        </nav>

        <main className="min-w-0 flex-1 px-4 py-5">
          <h1 className="mb-4 text-lg font-semibold tracking-tight">{title}</h1>
          {gate === "anon" ? (
            <AdminNotice>
              請先<Link to="/auth" className="underline"> 登入 </Link>管理者帳號。
            </AdminNotice>
          ) : gate === "loading" ? (
            <AdminNotice>載入中…</AdminNotice>
          ) : gate === "denied" || isError ? (
            <AdminNotice>這個帳號沒有管理後台權限。</AdminNotice>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

export function AdminNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background px-4 py-4 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background px-4 py-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {value === null ? <span className="text-base font-normal">暫無資料</span> : value}
      </p>
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="mb-4 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-ring"
    />
  );
}

/** 手機也能閱讀的清單：一列一張卡 */
export function AdminList<T>({
  rows,
  empty,
  renderRow,
}: {
  rows: T[];
  empty: string;
  renderRow: (row: T, index: number) => ReactNode;
}) {
  if (rows.length === 0) return <AdminNotice>{empty}</AdminNotice>;
  return <div className="flex flex-col gap-2">{rows.map(renderRow)}</div>;
}

export function RowCard({
  title,
  meta,
  onClick,
  active,
  children,
}: {
  title: ReactNode;
  meta?: ReactNode;
  onClick?: () => void;
  active?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border bg-background px-4 py-3 ${
        active ? "border-ring" : "border-border/60"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className="w-full text-left disabled:cursor-default"
      >
        <p className="truncate text-sm font-medium">{title}</p>
        {meta ? <p className="mt-1 text-xs break-words text-muted-foreground">{meta}</p> : null}
      </button>
      {children}
    </div>
  );
}

export function DetailGrid({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-border/60 pt-3 text-xs">
      {items.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="break-words">{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function useAdminQuery<T>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn, retry: false });
}
