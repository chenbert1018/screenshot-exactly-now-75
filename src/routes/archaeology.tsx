import { createFileRoute } from "@tanstack/react-router";
import { Candy, GitCommitVertical, Bookmark } from "lucide-react";
import { AppShell, PageHeader, SoftCard } from "@/components/AppShell";

export const Route = createFileRoute("/archaeology")({
  head: () => ({
    meta: [
      { title: "考古｜IdolDays" },
      { name: "description", content: "把喜歡過的每一個瞬間找回來。" },
      { property: "og:title", content: "考古｜IdolDays" },
      { property: "og:description", content: "把喜歡過的每一個瞬間找回來。" },
    ],
  }),
  component: ArchaeologyPage,
});

const entries = [
  { label: "糖點", desc: "那些讓你心動的瞬間", Icon: Candy },
  { label: "時間線", desc: "從第一天到現在", Icon: GitCommitVertical },
  { label: "我的收藏", desc: "被你留下來的片段", Icon: Bookmark },
];

function ArchaeologyPage() {
  return (
    <AppShell>
      <PageHeader title="考古" subtitle="把喜歡過的每一個瞬間找回來" />

      <div className="space-y-4">
        {entries.map(({ label, desc, Icon }) => (
          <SoftCard key={label} className="flex items-center gap-4 px-5 py-5 opacity-90">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-muted-foreground">
              <Icon className="size-5" strokeWidth={1.6} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium">{label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
            <span className="rounded-full bg-surface px-3 py-1 text-[13px] tracking-wide text-muted-foreground">
              尚未開放
            </span>
          </SoftCard>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">Coming Soon</p>
    </AppShell>
  );
}
