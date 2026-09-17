import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Plus, RefreshCw } from "lucide-react";
import { AppShell, PageHeader, EmptyState } from "@/components/AppShell";
import { IdolCard, EmptySlot } from "@/components/IdolCard";
import { IdolFormSheet } from "@/components/IdolFormSheet";
import { type IdolDraft } from "@/lib/idols";
import { useIdolSource } from "@/lib/idols.source";
import { Paywall } from "@/components/Paywall";
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
      <PageHeader
        title="我的偶像"
        subtitle="收藏那些讓你心動的名字"
        action={
          <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
            >
              <Plus className="size-4" strokeWidth={2} />
              新增偶像
          </button>
        }
      />

      {error ? (
        <p className="mb-4 rounded-2xl border border-border/60 bg-surface/50 px-4 py-3 text-center text-xs text-muted-foreground">
          目前連不上雲端資料，你的資料沒有遺失，請稍後再試。
        </p>
      ) : null}

      {ready && idols.length > 1 ? (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card/90 px-4 py-3 text-card-foreground shadow-soft">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <RefreshCw className="size-4 text-primary" />
              每日輪換封面偶像
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">每天自動換一位，只影響首頁封面</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={coverRotation}
            onClick={() => setCoverRotation(!coverRotation)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${coverRotation ? "bg-primary" : "bg-muted"}`}
          >
            <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-transform ${coverRotation ? "translate-x-5" : "translate-x-1"}`} />
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
              加入第一位偶像
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
        <p className="mt-6 text-center text-xs text-muted-foreground">最多 6 位偶像</p>
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
        title="新增偶像"
        submitLabel="建立偶像"
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
