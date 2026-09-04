import { createFileRoute } from "@tanstack/react-router";
import { UserRound, Settings, Bell, Palette, Sparkles, ChevronRight } from "lucide-react";
import { AppShell, PageHeader, Section, SoftCard } from "@/components/AppShell";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "我的｜IdolDays" },
      { name: "description", content: "個人資料與 App 設定。" },
      { property: "og:title", content: "我的｜IdolDays" },
      { property: "og:description", content: "個人資料與 App 設定。" },
    ],
  }),
  component: ProfilePage,
});

const settings = [
  { label: "一般設定", Icon: Settings },
  { label: "提醒通知", Icon: Bell },
  { label: "外觀主題", Icon: Palette },
];

function ProfilePage() {
  return (
    <AppShell>
      <PageHeader title="我的" />

      <SoftCard className="mb-8 flex items-center gap-4 px-5 py-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-surface text-muted-foreground">
          <UserRound className="size-7" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[17px] font-medium">尚未設定名稱</p>
          <p className="mt-1 text-sm text-muted-foreground">歡迎來到 IdolDays</p>
        </div>
      </SoftCard>

      <Section title="設定">
        <SoftCard className="divide-y divide-border/60">
          {settings.map(({ label, Icon }) => (
            <button
              key={label}
              type="button"
              className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors active:bg-surface/70"
            >
              <Icon className="size-[18px] text-muted-foreground" strokeWidth={1.6} />
              <span className="flex-1 text-sm">{label}</span>
              <ChevronRight className="size-4 text-muted-foreground" strokeWidth={1.6} />
            </button>
          ))}
        </SoftCard>
      </Section>

      <Section title="Premium">
        <SoftCard className="flex items-center gap-4 px-5 py-5">
          <div className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Sparkles className="size-5" strokeWidth={1.6} />
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-medium">IdolDays Premium</p>
            <p className="mt-1 text-sm text-muted-foreground">敬請期待</p>
          </div>
        </SoftCard>
      </Section>

      <p className="mt-10 text-center text-xs text-muted-foreground">版本 0.1.0（S0 Foundation）</p>
    </AppShell>
  );
}
