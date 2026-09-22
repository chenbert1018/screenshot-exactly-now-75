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
      <PageHeader
        title="我的本命 ♡"
        subtitle="照片・D-DAY・一起走過的日子"
        action={
          <button
            type="button"
            onClick={openAdd}
            aria-label="新增偶像"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-transform duration-300 active:scale-90"
          >
            <Plus className="size-5" strokeWidth={2} />
          </button>
        }
      />

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
              ✦ 每天換一位陪你
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
          title="先加入你的本命 ♡"
          description="名字＋一張照片，就可以開始。"
          action={
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 min-h-[50px] rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
            >
              <Plus className="size-4" strokeWidth={2} />
              ＋ 加入本命
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
        <p className="mt-7 text-center text-sm text-muted-foreground">
          ♡ 最多 6 位本命
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setPaywall(true)}
          className="mt-6 min-h-11 w-full text-center text-sm text-muted-foreground"
        >
          ♡ 目前 1 位 · IdolDays+ 可收 6 位
        </button>
      )}

      <IdolFormSheet
        open={open}
        onOpenChange={setOpen}
        title="加入本命 ♡"
        submitLabel="收好 ♡"
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
