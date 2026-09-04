import { createFileRoute } from "@tanstack/react-router";
import { Plus, UserRound } from "lucide-react";
import { AppShell, PageHeader, EmptyState, Section } from "@/components/AppShell";

export const Route = createFileRoute("/idols")({
  head: () => ({
    meta: [
      { title: "我的偶像｜IdolDays" },
      { name: "description", content: "收藏你喜歡的偶像，記錄屬於你們的重要日子。" },
      { property: "og:title", content: "我的偶像｜IdolDays" },
      { property: "og:description", content: "收藏你喜歡的偶像，記錄屬於你們的重要日子。" },
    ],
  }),
  component: IdolsPage,
});

function IdolsPage() {
  return (
    <AppShell>
      <PageHeader
        title="我的偶像"
        subtitle="一本只屬於你的收藏冊"
        action={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
          >
            <Plus className="size-4" strokeWidth={2} />
            新增偶像
          </button>
        }
      />

      <EmptyState
        icon={<UserRound className="size-5" strokeWidth={1.6} />}
        title="還沒有加入你的第一位偶像"
        description="開始收藏屬於你的追星日子吧"
      />

      <Section title="收藏區" hint="即將開放">
        <div className="grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-2xl border border-dashed border-border bg-surface/60"
              aria-hidden
            />
          ))}
        </div>
      </Section>
    </AppShell>
  );
}
