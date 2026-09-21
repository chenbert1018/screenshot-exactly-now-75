import { useState } from "react";
import { Check, Copy, Gift, Plus, RefreshCw, Share2, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Paywall } from "@/components/Paywall";
import {
  claimAlbumShareCode,
  enableAlbumShareCode,
  isValidShareEmail,
  normalizeShareCode,
  previewAlbumShareCode,
  shareLinkFor,
  useAlbumShare,
  type AlbumShareCodePreview,
  type AlbumShareMode,
} from "@/lib/album-share";
import { useSubscription } from "@/lib/subscription";
import { toast } from "sonner";

const OPTIONS: {
  mode: AlbumShareMode;
  emoji: string;
  title: string;
  description: string;
  plus: boolean;
}[] = [
  { mode: "PRIVATE", emoji: "🔒", title: "只有我", description: "只有你可以看", plus: false },
  { mode: "INVITED", emoji: "💌", title: "指定的人", description: "只分享給你選擇的人", plus: true },
  { mode: "PUBLIC", emoji: "🌎", title: "公開分享", description: "任何擁有連結的人都可以查看", plus: true },
];

function friendlyError(cause: unknown, fallback: string) {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}

/** 單一本相簿的分享設定（不影響其他相簿或帳號資料） */
export function AlbumShareSheet({
  open,
  onOpenChange,
  folderId,
  folderTitle,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  folderId: string;
  folderTitle: string;
}) {
  const { share, ready, loading, error, setMode, addRecipient, removeRecipient, regenerateLink } =
    useAlbumShare(folderId);
  const { isPlus: plus } = useSubscription();

  const [paywall, setPaywall] = useState(false);
  const [name, setName] = useState("");
  const [shareCode, setShareCode] = useState("");
  const [creatingCode, setCreatingCode] = useState(false);
  const [receiveCode, setReceiveCode] = useState("");
  const [preview, setPreview] = useState<AlbumShareCodePreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [claiming, setClaiming] = useState(false);

  function choose(mode: AlbumShareMode, needsPlus: boolean) {
    if (loading) return;
    if (needsPlus && !plus) {
      setPaywall(true);
      return;
    }
    void setMode(mode).catch(() => toast.error("分享設定儲存失敗，請稍後再試。"));
  }

  async function createShareCode() {
    if (creatingCode) return;
    setCreatingCode(true);
    try {
      const result = await enableAlbumShareCode({ folderId, title: folderTitle });
      setShareCode(result.shareCode);
      toast.success("分享碼準備好了 ♡");
    } catch (cause) {
      toast.error(friendlyError(cause, "分享碼沒有產生成功，請稍後再試。"));
    } finally {
      setCreatingCode(false);
    }
  }

  async function copyCode() {
    if (!shareCode) return;
    try {
      await navigator.clipboard.writeText(shareCode);
      toast.success("已複製分享碼 ♡");
    } catch {
      toast.error("複製失敗，請手動選取分享碼。");
    }
  }

  async function sendToFriend() {
    if (!shareCode) return;
    const title = folderTitle || "IdolDays 收藏";
    const receiveUrl = `${window.location.origin}/receive/${encodeURIComponent(shareCode)}`;
    const text = `🎁 我送你一份 IdolDays 收藏 ♡\n${title}\n\n點開預覽並收進你的 IdolDays：\n${receiveUrl}\n\n分享碼：${shareCode}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "IDOLDAYS SHARE ♡", text, url: receiveUrl });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("分享內容已複製，可以貼到 LINE ♡");
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(text);
        toast.success("分享內容已複製，可以貼到 LINE ♡");
      } catch {
        toast.error("分享沒有成功，請先複製分享碼。");
      }
    }
  }

  async function openPreview() {
    const code = normalizeShareCode(receiveCode);
    if (code.length !== 9) {
      toast.error("請輸入完整的 8 碼分享碼。");
      return;
    }
    setPreviewing(true);
    setPreview(null);
    try {
      const result = await previewAlbumShareCode(code);
      setReceiveCode(code);
      setPreview(result);
    } catch (cause) {
      toast.error(friendlyError(cause, "找不到這份收藏，請確認分享碼。"));
    } finally {
      setPreviewing(false);
    }
  }

  async function claimPreview() {
    if (!preview || claiming) return;
    setClaiming(true);
    try {
      const result = await claimAlbumShareCode(receiveCode);
      toast.success(`「${result.shareTitle}」已收進你的 IdolDays ♡`);
      onOpenChange(false);
      window.location.assign(`/memories/${result.folderId}`);
    } catch (cause) {
      toast.error(friendlyError(cause, "收藏沒有收進來，請稍後再試。"));
      setClaiming(false);
    }
  }

  const link = share.publicToken ? shareLinkFor(share.publicToken) : "";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="flex max-h-[88dvh] flex-col overflow-hidden p-0">
          <SheetHeader className="shrink-0 border-b border-border/50 bg-background/95 px-6 pb-4 pt-6 text-left backdrop-blur">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-primary">IDOLDAYS SHARE ♡</p>
            <SheetTitle className="font-display text-[20px]">分享這本回憶</SheetTitle>
            <SheetDescription>
              分享設定只作用於「{folderTitle || "這本相簿"}」，其他資料不會被看到。
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 [-webkit-overflow-scrolling:touch]">
            <section className="rounded-[1.75rem] border border-primary/15 bg-primary/[0.05] px-4 py-5 shadow-soft">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card text-primary shadow-soft">
                  <Gift className="size-4" strokeWidth={1.7} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-primary">IDOLDAYS SHARE ♡</p>
                  <h3 className="mt-1 font-display text-[17px] font-medium">把這份收藏送給朋友 ♡</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    不是公開貼文，只分享給你想分享的人。
                  </p>
                </div>
              </div>

              {shareCode ? (
                <div className="mt-4 rounded-2xl bg-card px-4 py-4 text-center shadow-soft">
                  <p className="text-[11px] tracking-[0.14em] text-muted-foreground">分享碼 ♡</p>
                  <p className="mt-1 font-display text-[24px] font-semibold tracking-[0.18em]">{shareCode}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => void copyCode()}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full bg-card px-3 py-2.5 text-sm font-medium text-foreground shadow-soft active:scale-95"
                    >
                      <Copy className="size-4" strokeWidth={1.8} />
                      複製分享碼
                    </button>
                    <button
                      type="button"
                      onClick={() => void sendToFriend()}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground shadow-soft active:scale-95"
                    >
                      <Share2 className="size-4" strokeWidth={1.8} />
                      傳給朋友 ♡
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    可從 iPhone 分享選單直接選 LINE、訊息、AirDrop 或其他 App。
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={creatingCode}
                  onClick={() => void createShareCode()}
                  className="mt-4 w-full rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft active:scale-[0.98] disabled:opacity-60"
                >
                  {creatingCode ? "正在準備分享碼…" : "產生分享碼 ♡"}
                </button>
              )}

              <div className="my-5 h-px bg-border/60" />

              <p className="text-[15px] font-medium">收到朋友的收藏？</p>
              <p className="mt-1 text-sm text-muted-foreground">輸入分享碼後會先預覽，不會直接加入你的回憶。</p>
              <div className="mt-3 flex gap-2">
                <input
                  value={receiveCode}
                  onChange={(event) => {
                    setReceiveCode(normalizeShareCode(event.target.value));
                    setPreview(null);
                  }}
                  maxLength={9}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="text"
                  placeholder="A7KM-P2QX"
                  className="min-w-0 flex-1 rounded-full bg-card px-4 py-2.5 text-center text-sm font-medium tracking-[0.12em] shadow-soft outline-none"
                />
                <button
                  type="button"
                  disabled={previewing || receiveCode.length !== 9}
                  onClick={() => void openPreview()}
                  className="shrink-0 rounded-full bg-card px-4 py-2.5 text-sm font-medium shadow-soft active:scale-95 disabled:opacity-50"
                >
                  {previewing ? "確認中…" : "預覽"}
                </button>
              </div>

              {preview ? (
                <div className="mt-4 rounded-2xl border border-border/60 bg-card px-4 py-4">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-primary">A GIFT FOR YOU ♡</p>
                  <h4 className="mt-1.5 font-display text-[18px] font-medium">{preview.shareTitle}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">♡ {preview.memoryCount} 則回憶</p>
                  {preview.shareMessage ? (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">「{preview.shareMessage}」</p>
                  ) : null}
                  <button
                    type="button"
                    disabled={claiming}
                    onClick={() => void claimPreview()}
                    className="mt-4 w-full rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft active:scale-[0.98] disabled:opacity-60"
                  >
                    {claiming ? "正在收進來…" : "收進我的 IdolDays ♡"}
                  </button>
                  <p className="mt-2 text-center text-[11px] leading-relaxed text-muted-foreground">
                    收下後會成為你自己的收藏，不會跟著原收藏一起改動。
                  </p>
                </div>
              ) : null}
            </section>

            <div className="pt-2">
              <p className="px-1 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">其他分享方式</p>
            </div>

            {!ready ? <p className="text-sm text-muted-foreground">正在載入分享設定…</p> : null}
            {loading ? <p className="text-sm text-muted-foreground">正在儲存分享設定…</p> : null}
            {error ? <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}
            {OPTIONS.map((o) => {
              const active = share.mode === o.mode;
              return (
                <button
                  key={o.mode}
                  type="button"
                  aria-pressed={active}
                  disabled={loading}
                  onClick={() => choose(o.mode, o.plus)}
                  className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors ${
                    active ? "border-primary/50 bg-accent/30" : "border-border/60 bg-card/70"
                  }`}
                >
                  <span className="text-lg leading-none select-none">{o.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[15px] font-medium">{o.title}</span>
                      {o.plus ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[13px] text-primary">IdolDays+</span> : null}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">{o.description}</span>
                  </span>
                  {active ? <Check className="mt-1 size-4 shrink-0 text-primary" strokeWidth={2} /> : null}
                </button>
              );
            })}

            {share.mode === "INVITED" && plus ? (
              <div className="rounded-2xl bg-surface/70 px-4 py-4">
                <p className="text-[15px] font-medium">分享對象</p>
                <p className="mt-1 text-sm text-muted-foreground">被指定的人只能閱讀，不能編輯、刪除或再分享。</p>
                <form
                  className="mt-3 flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!isValidShareEmail(name)) {
                      toast.error("請輸入有效的 Email。");
                      return;
                    }
                    void addRecipient(name)
                      .then(() => { setName(""); toast.success("已加入分享對象 ♡"); })
                      .catch(() => toast.error("新增分享對象失敗，請稍後再試。"));
                  }}
                >
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    type="email"
                    inputMode="email"
                    placeholder="輸入對方 Email"
                    className="min-w-0 flex-1 rounded-full bg-card px-4 py-2.5 text-sm shadow-soft outline-none"
                  />
                  <button type="submit" aria-label="新增分享對象" disabled={loading} className="rounded-full bg-primary p-2.5 text-primary-foreground shadow-soft active:scale-95">
                    <Plus className="size-4" strokeWidth={2} />
                  </button>
                </form>
                <div className="mt-3 space-y-2">
                  {share.recipients.length === 0 ? (
                    <p className="text-sm text-muted-foreground">還沒有分享給任何人。</p>
                  ) : share.recipients.map((r) => (
                    <div key={r} className="flex items-center justify-between rounded-full bg-card px-4 py-2 text-sm">
                      <span className="min-w-0 truncate">{r}</span>
                      <button
                        type="button"
                        aria-label={`移除 ${r}`}
                        disabled={loading}
                        onClick={() => {
                          void removeRecipient(r)
                            .then(() => toast.success("已移除分享對象"))
                            .catch(() => toast.error("移除失敗，請稍後再試。"));
                        }}
                        className="ml-2 shrink-0 rounded-full p-1 text-muted-foreground"
                      >
                        <X className="size-4" strokeWidth={1.8} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {share.mode === "PUBLIC" && plus ? (
              <div className="rounded-2xl bg-surface/70 px-4 py-4">
                <p className="text-[15px] font-medium">這本相簿的分享連結</p>
                <p className="mt-2 rounded-2xl bg-card px-4 py-2.5 text-sm break-all text-muted-foreground">{link}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!link || loading}
                    onClick={() => {
                      void navigator.clipboard?.writeText(link)
                        .then(() => toast.success("已複製連結 ♡"))
                        .catch(() => toast.error("複製失敗，請手動選取"));
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft active:scale-95"
                  >
                    <Copy className="size-4" strokeWidth={1.8} />
                    複製連結
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      void regenerateLink()
                        .then(() => toast.success("已重新產生連結，舊連結失效"))
                        .catch(() => toast.error("重新產生連結失敗，請稍後再試。"));
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-sm text-muted-foreground shadow-soft active:scale-95"
                  >
                    <RefreshCw className="size-4" strokeWidth={1.8} />
                    換一組
                  </button>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">擁有這個連結的人可以查看這本相簿。</p>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <Paywall open={paywall} onOpenChange={setPaywall} feature="MEMORY_SHARE" />
    </>
  );
}
