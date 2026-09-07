import { Link } from "@tanstack/react-router";
import {
  Home,
  Sparkles,
  CalendarHeart,
  FolderHeart,
  Heart as HeartIcon,
  CalendarDays,
  User,
} from "lucide-react";

const items = [
  { to: "/", label: "首頁", Icon: Home },
  { to: "/idols", label: "偶像", Icon: Sparkles },
  { to: "/events", label: "日子", Icon: CalendarHeart },
  { to: "/memories", label: "回憶", Icon: FolderHeart },
  { to: "/heart", label: "嗑糖", Icon: HeartIcon },
  { to: "/calendar", label: "行事曆", Icon: CalendarDays },
  { to: "/profile", label: "我的", Icon: User },
] as const;



export function BottomNav() {
  return (
    <nav
      aria-label="主要導覽"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-card/70 backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="group flex flex-col items-center gap-1 rounded-2xl py-1 text-muted-foreground transition-colors"
              activeProps={{ className: "text-primary [&_.nav-pill]:bg-accent/50" }}
            >
              <span className="nav-pill flex items-center justify-center rounded-full px-3.5 py-1 transition-colors duration-300">
                <Icon
                  className="size-[20px] transition-transform duration-300 group-active:scale-90"
                  strokeWidth={1.5}
                />
              </span>
              <span className="text-[10.5px] tracking-wide">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
