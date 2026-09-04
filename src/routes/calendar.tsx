import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { AppShell, PageHeader, Section, SoftCard, EmptyState } from "@/components/AppShell";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "行事曆｜IdolDays" },
      { name: "description", content: "生日、出道日、演唱會，你的重要日子都在這裡。" },
      { property: "og:title", content: "行事曆｜IdolDays" },
      { property: "og:description", content: "生日、出道日、演唱會，你的重要日子都在這裡。" },
    ],
  }),
  component: CalendarPage,
});

const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

function CalendarPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <AppShell>
      <PageHeader title="行事曆" subtitle={`${year} 年 ${month + 1} 月`} />

      <SoftCard className="mb-8 px-4 py-5">
        <div className="grid grid-cols-7 gap-y-2 text-center">
          {weekdays.map((w) => (
            <span key={w} className="text-[11px] text-muted-foreground">
              {w}
            </span>
          ))}
          {cells.map((d, i) => (
            <div key={i} className="flex h-10 items-center justify-center">
              {d ? (
                <span
                  className={`flex size-8 items-center justify-center rounded-full text-sm ${
                    d === now.getDate()
                      ? "bg-primary font-medium text-primary-foreground"
                      : "text-foreground/80"
                  }`}
                >
                  {d}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </SoftCard>

      <Section title="未來事件">
        <EmptyState
          icon={<CalendarDays className="size-5" strokeWidth={1.6} />}
          title="你的重要日子會出現在這裡"
          description="之後可以加入生日、出道日與演唱會"
        />
      </Section>
    </AppShell>
  );
}
