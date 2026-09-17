import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Plus, RefreshCw } from "lucide-react";
import { AppShell, PageHeader, EmptyState } from "@/components/AppShell";
import { IdolCard, EmptySlot } from "@/components/IdolCard";
import { IdolFormSheet } from "@/components/IdolFormSheet";
import { type IdolDraft } from "@/lib/idols";
import { useIdolSource } from "@/lib/idols.source";
import { Paywall } from "@/components/Paywall";
import { CloudRetryNotice } from "@/components/CloudRetryNotice";
import { useSubscription } from "@/lib/subscription";

export const Route = createFileRoute("/idols")({
  head: () => ({
    meta: [
      { title: "我的偶像｜IdolDays" },
      { name: "description", content: "收藏那些讓你心動的名字，記錄屬於你們的重要日子。" },
      { property: "og:title", content: "我的偶像｜IdolDays" },
      { property: "og:description", content: "收藏那些讓你心動的名字，記錄屬於你們的重要日子。" },
    ],
  }),
  component: IdolsLayout,
});

function IdolsLayout() {
  const matches = useMatches();
  const isChild = matches.some((m) => m.routeId === "/idols/$idolId");
  if (isChild) return <Outlet />;
  return <IdolsPage />;
}

function IdolsPage() {
  const {
    idols,
    ready,
    addIdol,
    error,
    mainIdol,
    coverRotation,
    setMainIdol,
    setCoverRotation,
    reload,
  } = useIdolSource();
  const [open, setOpen] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const { idolLimit, isPlus } = useSubscription();

  const canAdd = idols.length < idolLimit;
  const slots = Math.max(0, idolLimit - idols.length);

  function openAdd() {
    if (canAdd) setOpen(true);
    else setPaywall(true);
  }

  async function handleCreate(draft: IdolDraft) {
    await addIdol(draft);
    setOpen(false);
  }

  return (
    <AppShell>
      <header className="relative mb-7">
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 right-2 text-xl text-primary/25"
        >
          ✦
        </span>

        <p className="text-xs font-semibold tracking-[0.18em] text-primary">MY IDOL ♡</p>

        <div className="mt-2 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-[28px] leading-snug font-semibold">我喜歡的那個人</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              從一個名字開始，慢慢收藏我們的日子。
            </p>
          </div>

          <button
            type="button"
            onClick={openAdd}
            aria-label="新增偶像"
            className="mb-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-transform duration-300 active:scale-90"
          >
            <Plus className="size-4" strokeWidth={2} />
          </button>
        </div>
      </header>

      {error ? (
        <CloudRetryNotice onRetry={reload}>
          目前連不上雲端資料，你的資料沒有遺失，請稍後再試。
        </CloudRetryNotice>
      ) : null}

      {ready && idols.length > 1 ? (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-[1.5rem] border border-border/60 bg-card/75 px-4 py-3.5 text-card-foreground shadow-soft">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <RefreshCw className="size-4 text-primary" />
              每日輪換封面偶像
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              首頁每天自動換一位偶像，收藏內容不會改變。
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={coverRotation}
            onClick={() => setCoverRotation(!coverRotation)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${coverRotation ? "bg-primary" : "bg-muted"}`}
          >
            <span
              className={`absolute top-1 size-5 rounded-full bg-white shadow transition-transform ${coverRotation ? "translate-x-5" : "translate-x-1"}`}
            />
          </button>
        </div>
      ) : null}

      {ready && idols.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-5" strokeWidth={1.6} />}
          title="還沒有加入你的第一位偶像"
          description="從一個名字開始，收藏屬於你的追星日子。"
          action={
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
            >
              <Plus className="size-4" strokeWidth={2} />
              加入喜歡的人
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {idols.map((idol) => (
            <IdolCard
              key={idol.id}
              idol={idol}
              isMain={mainIdol?.id === idol.id}
              onSetMain={() => void setMainIdol(idol.id)}
            />
          ))}
          {Array.from({ length: slots }).map((_, i) => (
            <EmptySlot key={`slot-${i}`} onClick={openAdd} />
          ))}
        </div>
      )}

      {isPlus ? (
        <p className="mt-7 text-center text-xs text-muted-foreground">
          MY IDOL COLLECTION ♡ · 最多收藏 6 位
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setPaywall(true)}
          className="mt-6 w-full text-center text-xs text-muted-foreground"
        >
          免費版可收藏 1 位偶像 · IdolDays+ 最多 6 位（NT$90／月）
        </button>
      )}

      <IdolFormSheet
        open={open}
        onOpenChange={setOpen}
        title="加入喜歡的人"
        submitLabel="收進 IdolDays"
        onSubmit={handleCreate}
      />

      <Paywall
        open={paywall}
        onOpenChange={setPaywall}
        feature="IDOL_SLOT"
        onSubscribed={() => setOpen(true)}
      />
    </AppShell>
  );
}
