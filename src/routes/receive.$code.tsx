import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Check, Gift, Sparkles, Heart } from "lucide-react";
import {
  claimAlbumShareCode,
  normalizeShareCode,
  previewAlbumShareCode,
  type AlbumShareCodePreview,
} from "@/lib/album-share";
import { toast } from "sonner";

export const Route = createFileRoute("/receive/$code")({
  head: () => ({
    meta: [
      { title: "收到一份 IdolDays 收藏 ♡" },
      { name: "description", content: "有人送你一份 IdolDays 收藏，先看看再決定要不要收下。" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReceiveAlbumPage,
});

function ReceiveAlbumPage() {
  const { code: rawCode } = Route.useParams();
  const code = normalizeShareCode(decodeURIComponent(rawCode));
  const { user, loading: authLoading } = useAuth();
  const [preview, setPreview] = useState<AlbumShareCodePreview | null | undefined>(undefined);
  const [claiming, setClaiming] = useState(false);
  const [received, setReceived] = useState<{ folderId: string; title: string; count: number; senderName?: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setPreview(null);
      return;
    }
    let active = true;
    setPreview(undefined);
    void previewAlbumShareCode(code)
      .then((data) => { if (active) setPreview(data); })
      .catch(() => { if (active) setPreview(null); });
    return () => { active = false; };
  }, [authLoading, code, user]);

  async function receive() {
    if (!preview || claiming) return;
    setClaiming(true);
    try {
      const result = await claimAlbumShareCode(code);
      setReceived({ folderId: result.folderId, title: result.shareTitle, count: result.importedMemoryCount, senderName: preview.senderName });
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "收藏沒有收進來，請稍後再試。");
      setClaiming(false);
    }
  }

  if (authLoading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-5 text-center">
        <p className="text-sm text-muted-foreground">正在確認 IdolDays 帳號…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-xl items-end justify-center bg-gradient-to-b from-background via-background to-primary/[0.08] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] sm:items-center sm:px-5">
        <section className="relative w-full overflow-hidden rounded-[2rem] border border-primary/15 bg-card px-6 py-8 text-center shadow-soft">
          <Sparkles className="absolute left-7 top-8 size-4 text-primary/30" strokeWidth={1.4} />
          <Heart className="absolute right-8 top-10 size-4 text-primary/25" strokeWidth={1.4} />
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Gift className="size-6" strokeWidth={1.6} />
          </div>
          <p className="mt-5 text-[13px] font-semibold tracking-[0.14em] text-primary">IDOLDAYS SHARE ♡</p>
          <h1 className="mt-2 font-display text-[27px] font-semibold leading-tight">有人留了一份追星回憶給你 ♡</h1>
          <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-muted-foreground">
            登入或免費建立 IdolDays 帳號，就能打開朋友送來的收藏，收進自己的回憶裡。
          </p>
          <div className="mt-6 rounded-[1.5rem] border border-primary/10 bg-primary/[0.06] px-5 py-4">
            <p className="text-[13px] font-semibold tracking-[0.12em] text-primary">A GIFT FOR YOU</p>
            <p className="mt-2 text-sm text-muted-foreground">分享碼</p>
            <p className="mt-1 font-display text-[22px] font-semibold tracking-[0.16em] text-foreground">{code}</p>
          </div>
          <Link
            to="/auth"
            search={{ returnTo: `/receive/${encodeURIComponent(code)}` }}
            className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-base font-semibold text-primary-foreground shadow-soft transition-transform active:scale-[0.97]"
          >
            收下這份回憶 ♡
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            還沒有 IdolDays？這裡就能免費建立帳號。
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground/80">
            收藏內容只有登入後才能查看，不會公開顯示。
          </p>
        </section>
      </main>
    );
  }

  if (preview === undefined) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-5 text-center">
        <div>
          <p className="text-[13px] font-semibold tracking-[0.14em] text-primary">IDOLDAYS SHARE ♡</p>
          <p className="mt-3 text-sm text-muted-foreground">正在打開朋友送你的收藏…</p>
        </div>
      </main>
    );
  }

  if (!preview) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6 text-center">
        <div className="w-full rounded-[2rem] border border-border/60 bg-card px-6 py-8 shadow-soft">
          <Gift className="mx-auto size-8 text-primary" strokeWidth={1.5} />
          <p className="mt-4 font-display text-[22px]">這份收藏目前無法開啟。</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            分享碼可能已失效或已被分享者取消。
          </p>
          <p className="mt-4 rounded-full bg-surface px-4 py-2 text-sm tracking-[0.14em] text-muted-foreground">{code}</p>
          <Link to="/" className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
            打開 IdolDays
          </Link>
        </div>
      </main>
    );
  }

  if (received) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-xl items-end justify-center bg-gradient-to-b from-background via-background to-primary/[0.06] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] sm:items-center sm:px-5">
        <section className="relative w-full overflow-hidden rounded-[2rem] border border-primary/15 bg-card px-6 py-8 text-center shadow-soft">
          <Sparkles className="absolute left-8 top-8 size-4 animate-pulse text-primary/35" strokeWidth={1.4} />
          <Sparkles className="absolute right-10 top-16 size-3 animate-pulse text-primary/25" strokeWidth={1.4} />
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary animate-in zoom-in-75 duration-500">
            <Check className="size-7" strokeWidth={1.8} />
          </div>
          <p className="mt-5 text-[13px] font-semibold tracking-[0.14em] text-primary">IDOLDAYS SHARE ♡</p>
          <h1 className="mt-2 font-display text-[26px] font-medium">收到了 ♡</h1>
          <p className="mt-2 text-sm text-muted-foreground">這份收藏已經放進你的回憶</p>
          <div className="mt-6 rounded-[1.5rem] bg-surface/80 px-5 py-5 text-left">
            <p className="font-display text-[20px] font-medium">{received.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">♡ {received.count} 則回憶 · 來自 {received.senderName || "一位 IdolDays 粉絲"} 的收藏</p>
          </div>
          <button
            type="button"
            onClick={() => window.location.assign(`/memories/${received.folderId}`)}
            className="mt-6 min-h-[52px] w-full rounded-full bg-primary px-5 py-3 text-base font-semibold text-primary-foreground shadow-soft transition-transform active:scale-[0.97]"
          >
            打開收藏
          </button>
          <Link to="/" className="mt-2 inline-flex min-h-[44px] items-center justify-center px-5 text-sm text-muted-foreground">
            先回首頁
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-xl items-end justify-center bg-gradient-to-b from-background via-background to-primary/[0.06] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] sm:items-center sm:px-5">
      <section className="w-full overflow-hidden rounded-[2rem] border border-primary/15 bg-card shadow-soft">
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-foreground/10 sm:hidden" />
        <div className="px-5 pb-7 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Gift className="size-5" strokeWidth={1.6} />
            </div>
            <div>
              <p className="text-[13px] font-semibold tracking-[0.14em] text-primary">IDOLDAYS SHARE ♡</p>
              <p className="mt-0.5 text-sm text-muted-foreground">一份回憶正在等你收下</p>
            </div>
          </div>

          <div className="mt-5 rounded-[1.6rem] border border-primary/10 bg-gradient-to-b from-primary/[0.07] to-surface/70 px-5 py-6">
            <p className="text-[13px] font-semibold tracking-[0.12em] text-primary">A GIFT FOR YOU ♡</p>
            <h1 className="mt-2 font-display text-[25px] font-medium leading-snug">{preview.shareTitle}</h1>
            <p className="mt-2 text-sm text-muted-foreground">♡ {preview.memoryCount} 則回憶</p>
            <p className="mt-4 text-sm text-muted-foreground">來自 {preview.senderName || "一位 IdolDays 粉絲"} 的收藏 ♡</p>
          </div>

          {preview.shareMessage ? (
            <p className="mt-4 rounded-2xl bg-surface px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              「{preview.shareMessage}」
            </p>
          ) : null}

          <button
            type="button"
            disabled={claiming}
            onClick={() => void receive()}
            className="mt-6 min-h-[52px] w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-soft transition-transform active:scale-[0.97] disabled:opacity-60"
          >
            {claiming ? "正在收進你的回憶…" : "收進我的 IdolDays ♡"}
          </button>
          <p className="mt-3 text-center text-[13px] leading-relaxed text-muted-foreground">
            分享碼 {code} · 收下前不會修改你的任何收藏
          </p>
        </div>
      </section>
    </main>
  );
}
