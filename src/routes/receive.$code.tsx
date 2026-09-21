import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Check, Gift, Sparkles } from "lucide-react";
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
  const [received, setReceived] = useState<{ folderId: string; title: string; count: number } | null>(null);

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
      setReceived({ folderId: result.folderId, title: result.shareTitle, count: result.importedMemoryCount });
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
      <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6 py-10 text-center">
        <section className="w-full rounded-[2rem] border border-primary/15 bg-card px-6 py-8 shadow-soft">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Gift className="size-5" strokeWidth={1.6} />
          </div>
          <p className="mt-5 text-[11px] font-semibold tracking-[0.18em] text-primary">IDOLDAYS SHARE ♡</p>
          <h1 className="mt-2 font-display text-[24px] font-medium">有人送你一份 IdolDays 收藏 ♡</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            這份收藏只提供給 IdolDays 使用者。登入或建立帳號後，才能在 App 裡預覽並收下。
          </p>
          <p className="mt-4 rounded-full bg-surface px-4 py-2 text-sm tracking-[0.14em] text-muted-foreground">
            分享碼 {code}
          </p>
          <Link
            to="/auth"
            search={{ returnTo: `/receive/${encodeURIComponent(code)}` }}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-soft"
          >
            登入／建立 IdolDays 帳號 ♡
          </Link>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            收藏內容不會在未登入的網頁公開顯示。
          </p>
        </section>
      </main>
    );
  }

  if (preview === undefined) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-5 text-center">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-primary">IDOLDAYS SHARE ♡</p>
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
          <p className="mt-5 text-[11px] font-semibold tracking-[0.18em] text-primary">IDOLDAYS SHARE ♡</p>
          <h1 className="mt-2 font-display text-[26px] font-medium">收到了 ♡</h1>
          <p className="mt-2 text-sm text-muted-foreground">這份收藏已經放進你的回憶</p>
          <div className="mt-6 rounded-[1.5rem] bg-surface/80 px-5 py-5 text-left">
            <p className="font-display text-[20px] font-medium">{received.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">♡ {received.count} 則回憶 · 來自朋友的收藏</p>
          </div>
          <button
            type="button"
            onClick={() => window.location.assign(`/memories/${received.folderId}`)}
            className="mt-6 min-h-[52px] w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-soft transition-transform active:scale-[0.97]"
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
              <p className="text-[11px] font-semibold tracking-[0.18em] text-primary">IDOLDAYS SHARE ♡</p>
              <p className="mt-0.5 text-sm text-muted-foreground">一份回憶正在等你收下</p>
            </div>
          </div>

          <div className="mt-5 rounded-[1.6rem] border border-primary/10 bg-gradient-to-b from-primary/[0.07] to-surface/70 px-5 py-6">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-primary">A GIFT FOR YOU ♡</p>
            <h1 className="mt-2 font-display text-[25px] font-medium leading-snug">{preview.shareTitle}</h1>
            <p className="mt-2 text-sm text-muted-foreground">♡ {preview.memoryCount} 則回憶</p>
            <p className="mt-4 text-xs text-muted-foreground">來自一位 IdolDays 粉絲的收藏 ♡</p>
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
          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            分享碼 {code} · 收下前不會修改你的任何收藏
          </p>
        </div>
      </section>
    </main>
  );
}
