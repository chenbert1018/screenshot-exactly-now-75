import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ImageIcon, Pencil } from "lucide-react";
import { AppShell, SoftCard } from "@/components/AppShell";
import { IdolFormSheet } from "@/components/IdolFormSheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIdols, type IdolDraft } from "@/lib/idols";
import { daysSince, primaryDay, nextAnniversary } from "@/lib/dates";

export const Route = createFileRoute("/idols/$idolId")({
  head: () => ({
    meta: [
      { title: "偶像日子｜IdolDays" },
      { name: "description", content: "查看這位偶像的生日、出道日與你喜歡他的日子。" },
      { property: "og:title", content: "偶像日子｜IdolDays" },
      { property: "og:description", content: "查看這位偶像的生日、出道日與你喜歡他的日子。" },
    ],
  }),
  component: IdolDetailPage,
});

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/50 py-3 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-[15px]">{value || "未填寫"}</span>
    </div>
  );
}

function IdolDetailPage() {
  const { idolId } = Route.useParams();
  const navigate = useNavigate();
  const { idols, ready, updateIdol, removeIdol } = useIdols();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const idol = idols.find((i) => i.id === idolId);

  if (!ready) {
    return (
      <AppShell>
        <div className="h-40" />
      </AppShell>
    );
  }

  if (!idol) {
    return (
      <AppShell>
        <p className="mt-16 text-center text-sm text-muted-foreground">找不到這位偶像</p>
        <div className="mt-5 flex justify-center">
          <Link
            to="/idols"
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft"
          >
            回到我的偶像
          </Link>
        </div>
      </AppShell>
    );
  }

  function handleSave(draft: IdolDraft) {
    updateIdol(idolId, draft);
    setEditing(false);
  }

  function handleDelete() {
    removeIdol(idolId);
    setConfirming(false);
    setEditing(false);
    navigate({ to: "/idols" });
  }

  const { id: _id, ...draft } = idol;
  const day = primaryDay(idol);
  const since = daysSince(idol.sinceDate);
  const debut = nextAnniversary(idol.debutDate);

  return (
    <AppShell>
      <div className="mb-5 flex items-center justify-between">
        <Link
          to="/idols"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ChevronLeft className="size-4" strokeWidth={1.8} />
          我的偶像
        </Link>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3.5 py-1.5 text-sm transition-transform duration-300 active:scale-95"
        >
          <Pencil className="size-3.5" strokeWidth={1.8} />
          編輯
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft">
        <div className="aspect-[4/5] w-full bg-surface">
          {idol.photo ? (
            <img src={idol.photo} alt={`${idol.name} 的照片`} className="size-full object-cover" />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageIcon className="size-7" strokeWidth={1.3} />
              <span className="text-xs">放一張你最喜歡的照片</span>
            </div>
          )}
        </div>
        <div className="px-6 py-6 text-center">
          <h1 className="text-2xl font-semibold">{idol.name}</h1>
          {idol.groupName ? (
            <p className="mt-1.5 text-sm text-muted-foreground">{idol.groupName}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <SoftCard className="px-4 py-5 text-center">
          <p className="text-xs text-muted-foreground">{day ? day.title : "D-Day"}</p>
          <p className="mt-2 text-2xl font-semibold text-primary">
            {day ? day.ddayLabel : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {day ? day.humanLabel : "設定一個重要日子"}
          </p>
        </SoftCard>
        <SoftCard className="px-4 py-5 text-center">
          <p className="text-xs text-muted-foreground">陪伴的日子</p>
          <p className="mt-2 text-2xl font-semibold text-primary">
            {since ? since.ddayLabel : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {since ? since.humanLabel : "設定喜歡他的日期"}
          </p>
        </SoftCard>
      </div>

      <SoftCard className="mt-5 px-5 py-2">
        <Row label="生日" value={idol.birthday} />
        <Row
          label="出道日期"
          value={
            idol.debutDate
              ? `${idol.debutDate}（${debut?.daysUntil === 0 ? "今天是出道紀念日" : `出道紀念日 ${debut?.ddayLabel}`}）`
              : ""
          }
        />
        <Row label="粉絲名稱" value={idol.fanName} />
        <Row label="我喜歡他的日期" value={idol.sinceDate} />
      </SoftCard>

      <IdolFormSheet
        open={editing}
        onOpenChange={setEditing}
        initial={draft}
        title="編輯偶像"
        submitLabel="儲存"
        onSubmit={handleSave}
        footer={
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="w-full rounded-full py-3 text-sm text-destructive transition-transform duration-300 active:scale-95"
          >
            刪除偶像
          </button>
        }
      />

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent className="max-w-[20rem] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>確定要移除這位偶像嗎？</AlertDialogTitle>
            <AlertDialogDescription>移除後目前的本地資料將會消失。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>確認移除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
