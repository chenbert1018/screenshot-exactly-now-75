import { createFileRoute, Link } from "@tanstack/react-router";
import { ImageIcon, Plus } from "lucide-react";
import { AppShell, PageHeader, EmptyState, SoftCard } from "@/components/AppShell";
import { useIdolSource } from "@/lib/idols.source";
import { useEventSource } from "@/lib/events.source";
import { useWidgetPreferenceSource } from "@/lib/widget-preferences.source";
import {
  getWidgetCompanionContent,
  WIDGET_CONTENT_TYPES,
  type WidgetContentType,
} from "@/lib/widget";

export const Route = createFileRoute("/widget")({
  head: () => ({
    meta: [
      { title: "桌面陪伴｜IdolDays" },
      { name: "description", content: "讓他每天出現在你的桌面，每天都是不一樣的陪伴。" },
      { property: "og:title", content: "桌面陪伴｜IdolDays" },
      { property: "og:description", content: "讓他每天出現在你的桌面，每天都是不一樣的陪伴。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WidgetPage,
});

const CONTENT_LABELS: Record<WidgetContentType, string> = {
  IDOL: "偶像",
  MESSAGE: "每日一句",
  DECORATION: "小裝飾",
  MOOD: "今日心情",
  COUNTDOWN: "重要日子",
};

function WidgetPage() {
  const { idols, ready } = useIdolSource();
  const { events } = useEventSource();
  const { prefs, update: updatePrefs } = useWidgetPreferenceSource();

  if (!ready || !prefs) {
    return (
      <AppShell>
        <PageHeader title="桌面陪伴" subtitle="讓他每天出現在你的桌面。" />
        <div className="h-64 rounded-3xl border border-border/60 bg-surface/40" aria-hidden />
      </AppShell>
    );
  }

  if (idols.length === 0) {
    return (
      <AppShell>
        <PageHeader title="桌面陪伴" subtitle="讓他每天出現在你的桌面。" />
        <EmptyState
          icon={<ImageIcon className="size-5" strokeWidth={1.6} />}
          title="先建立一位偶像，才能讓他出現在桌面 ♡"
          description="加入偶像之後，這裡每天都會有不一樣的陪伴。"
          action={
            <Link
              to="/idols"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
            >
              <Plus className="size-4" strokeWidth={2} />
              新增偶像
            </Link>
          }
        />
      </AppShell>
    );
  }

  const content = getWidgetCompanionContent({ idols, events, preferences: prefs });
  const on = (t: WidgetContentType) => prefs.enabledContents.includes(t);

  function toggle(t: WidgetContentType) {
    const current = prefs?.enabledContents ?? [];
    const next = current.includes(t) ? current.filter((x) => x !== t) : [...current, t];
    void updatePrefs({ enabledContents: next });
  }

  function chooseIdol(id: string) {
    void updatePrefs({ idolId: id });
  }

  const selectedId = content.idol?.id ?? "";

  return (
    <AppShell>
      <PageHeader title="桌面陪伴" subtitle="讓他每天出現在你的桌面。" />

      <p className="mb-3 text-[13px] tracking-wide text-muted-foreground">你的桌面陪伴</p>

      {/* App 內的視覺 Preview（非 iOS Widget） */}
      <div className="mx-auto w-full max-w-[300px] rounded-[28px] border border-border/60 bg-card/80 p-6 text-center shadow-soft backdrop-blur">
        {on("DECORATION") ? (
          <p className="mb-4 text-[13px] text-muted-foreground">
            <span className="mr-1 text-base">{content.decoration.emoji}</span>
            {content.decoration.label}
          </p>
        ) : null}

        {on("IDOL") ? (
          <div className="mx-auto mb-5 size-24 overflow-hidden rounded-full border border-border/60 bg-surface">
            {content.idol?.image ? (
              <img
                src={content.idol.image}
                alt={`${content.idol.name} 的照片`}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center font-display text-2xl text-muted-foreground">
                {content.idol?.name?.slice(0, 1) ?? "♡"}
              </div>
            )}
          </div>
        ) : null}

        {on("IDOL") && content.idol ? (
          <p className="mb-3 text-[15px] font-medium">{content.idol.name}</p>
        ) : null}

        {on("MESSAGE") ? (
          <p className="text-[15px] leading-relaxed">「{content.dailyMessage}」</p>
        ) : null}

        {on("MOOD") ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {content.mood.emoji} {content.mood.label}
          </p>
        ) : null}

        {on("COUNTDOWN") ? (
          content.importantDate ? (
            <div className="mt-5">
              <p className="font-display text-[34px] leading-none font-semibold text-primary">
                {content.importantDate.countdownLabel}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">{content.importantDate.title}</p>
            </div>
          ) : (
            <p className="mt-5 text-xs text-muted-foreground">還沒有下一個重要日子</p>
          )
        ) : null}
      </div>

      <SoftCard className="mt-8 px-5 py-5">
        <p className="text-sm">你想讓桌面上的他陪你什麼？</p>
        <div className="mt-4 space-y-2">
          {WIDGET_CONTENT_TYPES.map((t) => (
            <label
              key={t}
              className="flex cursor-pointer items-center justify-between rounded-2xl border border-border/50 px-4 py-3 text-sm"
            >
              <span>{CONTENT_LABELS[t]}</span>
              <input
                type="checkbox"
                checked={on(t)}
                onChange={() => toggle(t)}
                className="size-4 accent-[var(--color-primary)]"
              />
            </label>
          ))}
        </div>
      </SoftCard>

      {idols.length > 1 ? (
        <SoftCard className="mt-5 px-5 py-5">
          <p className="text-sm">選擇桌面陪伴的偶像</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {idols.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => chooseIdol(i.id)}
                className={`rounded-full border px-4 py-2 text-xs transition-transform duration-300 active:scale-95 ${
                  selectedId === i.id
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border/60 text-muted-foreground"
                }`}
              >
                {i.name}
              </button>
            ))}
          </div>
        </SoftCard>
      ) : null}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        每天都會依照日期、心情與重要日子換一個樣子 ♡
      </p>
    </AppShell>
  );
}
