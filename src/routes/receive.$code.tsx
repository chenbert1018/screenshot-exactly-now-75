import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Gift } from "lucide-react";
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
      toast.success(`「${result.shareTitle}」已收進你的 IdolDays ♡`);
      window.location.assign(`/memories/${result.folderId}`);
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

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-5 py-10">
      <section className="w-full rounded-[2rem] border border-primary/15 bg-card px-5 py-7 shadow-soft">
        <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Gift className="size-5" strokeWidth={1.6} />
        </div>
        <p className="mt-5 text-[11px] font-semibold tracking-[0.18em] text-primary">A GIFT FOR YOU ♡</p>
        <p className="mt-2 text-sm text-muted-foreground">有人分享了一份收藏給你 ♡</p>
        <h1 className="mt-3 font-display text-[25px] font-medium leading-snug">{preview.shareTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">♡ {preview.memoryCount} 則回憶</p>
        {preview.shareMessage ? (
          <p className="mt-4 rounded-2xl bg-surface px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            「{preview.shareMessage}」
          </p>
        ) : null}
        <button
          type="button"
          disabled={claiming}
          onClick={() => void receive()}
          className="mt-6 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-soft active:scale-[0.98] disabled:opacity-60"
        >
          {claiming ? "正在收進來…" : "收進我的 IdolDays ♡"}
        </button>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
          分享碼 {code} · 收下後會建立在你的帳號中
        </p>
      </section>
    </main>
  );
}
