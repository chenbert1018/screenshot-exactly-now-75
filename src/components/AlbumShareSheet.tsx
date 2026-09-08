import { useState } from "react";
import { Check, Copy, Plus, RefreshCw, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Paywall } from "@/components/Paywall";
import { shareLinkFor, useAlbumShare, type AlbumShareMode } from "@/lib/album-share";
import { isPlusActive, useSubscription } from "@/lib/subscription";
import { toast } from "sonner";

const OPTIONS: {
  mode: AlbumShareMode;
  emoji: string;
  title: string;
  description: string;
  plus: boolean;
}[] = [
  { mode: "PRIVATE", emoji: "🔒", title: "只有我", description: "只有你可以看", plus: false },
  {
    mode: "INVITED",
    emoji: "💌",
    title: "指定的人",
    description: "只分享給你選擇的人",
    plus: true,
  },
  {
    mode: "PUBLIC",
    emoji: "🌎",
    title: "公開分享",
    description: "任何擁有連結的人都可以查看",
    plus: true,
  },
];

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
  const { share, setMode, addRecipient, removeRecipient, regenerateLink } =
    useAlbumShare(folderId);
  const { state } = useSubscription();
  const plus = isPlusActive(state);

  const [paywall, setPaywall] = useState(false);
  const [name, setName] = useState("");

  function choose(mode: AlbumShareMode, needsPlus: boolean) {
    if (needsPlus && !plus) {
      setPaywall(true);
      return;
    }
    setMode(mode);
  }

  const link = share.publicToken ? shareLinkFor(share.publicToken) : "";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle className="font-display text-[20px]">分享這本回憶</SheetTitle>
            <SheetDescription>
              分享設定只作用於「{folderTitle || "這本相簿"}」，其他資料不會被看到。
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 px-4 pb-6">
            {OPTIONS.map((o) => {
              const active = share.mode === o.mode;
              return (
                <button
                  key={o.mode}
                  type="button"
                  aria-pressed={active}
                  onClick={() => choose(o.mode, o.plus)}
                  className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors ${
                    active ? "border-primary/50 bg-accent/30" : "border-border/60 bg-card/70"
                  }`}
                >
                  <span className="text-lg leading-none select-none">{o.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[15px] font-medium">{o.title}</span>
                      {o.plus ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[13px] text-primary">
                          IdolDays+
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {o.description}
                    </span>
                  </span>
                  {active ? (
                    <Check className="mt-1 size-4 shrink-0 text-primary" strokeWidth={2} />
                  ) : null}
                </button>
              );
            })}

            {share.mode === "INVITED" && plus ? (
              <div className="rounded-2xl bg-surface/70 px-4 py-4">
                <p className="text-[15px] font-medium">分享對象</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  被指定的人只能閱讀，不能編輯、刪除或再分享。
                </p>
                <form
                  className="mt-3 flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addRecipient(name);
                    setName("");
                  }}
                >
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="輸入 Email 或暱稱"
                    className="min-w-0 flex-1 rounded-full bg-card px-4 py-2.5 text-sm shadow-soft outline-none"
                  />
                  <button
                    type="submit"
                    aria-label="新增分享對象"
                    className="rounded-full bg-primary p-2.5 text-primary-foreground shadow-soft active:scale-95"
                  >
                    <Plus className="size-4" strokeWidth={2} />
                  </button>
                </form>
                <div className="mt-3 space-y-2">
                  {share.recipients.length === 0 ? (
                    <p className="text-sm text-muted-foreground">還沒有分享給任何人。</p>
                  ) : (
                    share.recipients.map((r) => (
                      <div
                        key={r}
                        className="flex items-center justify-between rounded-full bg-card px-4 py-2 text-sm"
                      >
                        <span className="min-w-0 truncate">{r}</span>
                        <button
                          type="button"
                          aria-label={`移除 ${r}`}
                          onClick={() => removeRecipient(r)}
                          className="ml-2 shrink-0 rounded-full p-1 text-muted-foreground"
                        >
                          <X className="size-4" strokeWidth={1.8} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            {share.mode === "PUBLIC" && plus ? (
              <div className="rounded-2xl bg-surface/70 px-4 py-4">
                <p className="text-[15px] font-medium">這本相簿的分享連結</p>
                <p className="mt-2 rounded-2xl bg-card px-4 py-2.5 text-sm break-all text-muted-foreground">
                  {link}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard
                        ?.writeText(link)
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
                    onClick={() => {
                      regenerateLink();
                      toast.success("已重新產生連結，舊連結失效");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-sm text-muted-foreground shadow-soft active:scale-95"
                  >
                    <RefreshCw className="size-4" strokeWidth={1.8} />
                    換一組
                  </button>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  連結目前只保存在這台手機，雲端分享還在準備中。
                </p>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <Paywall open={paywall} onOpenChange={setPaywall} feature="MEMORY_SHARE" />
    </>
  );
}
