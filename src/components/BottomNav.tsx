import { Link } from "@tanstack/react-router";
import { Home, Sparkles, Search, CalendarDays, User } from "lucide-react";

const items = [
  { to: "/", label: "首頁", Icon: Home },
  { to: "/idols", label: "偶像", Icon: Sparkles },
  { to: "/archaeology", label: "考古", Icon: Search },
  { to: "/calendar", label: "行事曆", Icon: CalendarDays },
  { to: "/profile", label: "我的", Icon: User },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label="主要導覽"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/85 backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="group flex flex-col items-center gap-1 rounded-xl py-1.5 text-muted-foreground transition-colors"
              activeProps={{ className: "text-primary" }}
            >
              <Icon
                className="size-[22px] transition-transform duration-300 group-active:scale-90"
                strokeWidth={1.6}
              />
              <span className="text-[11px] tracking-wide">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
