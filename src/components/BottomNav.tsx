import { Link } from "@tanstack/react-router";
import {
  TodayIcon,
  IdolIcon,
  DayIcon,
  MemoryIcon,
  ArchiveIcon,
} from "./IdolDaysIcons";

const items = [
  { to: "/", label: "今天", Icon: TodayIcon },
  { to: "/idols", label: "偶像", Icon: IdolIcon },
  { to: "/events", label: "日子", Icon: DayIcon },
  { to: "/memories", label: "回憶", Icon: MemoryIcon },
  { to: "/archaeology", label: "考古", Icon: ArchiveIcon },
] as const;



export function BottomNav() {
  return (
    <nav
      aria-label="主要導覽"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-card/70 backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">

        {items.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="group flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-2xl py-1 text-muted-foreground transition-colors active:scale-[0.96]"
              activeProps={{ className: "text-primary [&_.nav-pill]:bg-accent/50" }}
            >
              <span className="nav-pill relative flex items-center justify-center rounded-full px-3.5 py-1 transition-colors duration-300">
                <Icon
                  className="size-[22px] transition-transform duration-300 group-active:scale-90"
                  strokeWidth={1.5}
                />
              </span>
              <span className="text-[14px] font-medium tracking-[0.01em]">{label}</span>

            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
