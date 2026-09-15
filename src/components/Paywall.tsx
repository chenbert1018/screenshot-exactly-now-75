import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  PLUS_BENEFITS,
  PLUS_CTA,
  PLUS_NAME,
  PLUS_PRICE_LABEL,
  PLUS_SECONDARY_CTA,
  PLUS_TAGLINE,
  PREMIUM_FEATURE_COPY,
  useSubscription,
  type PremiumFeature,
} from "@/lib/subscription";

/** 全 App 唯一的訂閱牆（沒有試用、沒有買斷） */
export function Paywall({
  open,
  onOpenChange,
  feature,
  onSubscribed,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  feature?: PremiumFeature;
  onSubscribed?: () => void;
}) {
  const { subscribe, restorePurchases, localizedPrice } = useSubscription();
  const copy = feature ? PREMIUM_FEATURE_COPY[feature] : null;

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubscribe() {
    if (isPurchasing || isRestoring) return;

    setIsPurchasing(true);
    setMessage(null);

    try {
      const result = await subscribe();

      if (result.status === "purchased" && result.active) {
        onOpenChange(false);
        onSubscribed?.();
        return;
      }

      if (result.status === "pending") {
        setMessage("購買正在等待 Apple 確認。");
      } else if (result.status === "unavailable") {
        setMessage("請在 iPhone App 中訂閱 IdolDays+。");
      }
    } catch (error) {
      console.error("IdolDays+ purchase failed", error);
      setMessage("目前無法完成購買，請稍後再試。");
    } finally {
      setIsPurchasing(false);
    }
  }

  async function handleRestorePurchases() {
    if (isPurchasing || isRestoring) return;

    setIsRestoring(true);
    setMessage(null);

    try {
      const result = await restorePurchases();

      if (result.active) {
        onOpenChange(false);
        onSubscribed?.();
        return;
      }

      setMessage("目前沒有找到有效的 IdolDays+ 訂閱。");
    } catch (error) {
      console.error("IdolDays+ restore failed", error);
      setMessage("恢復購買失敗，請稍後再試。");
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 font-display text-[20px]">
            <Sparkles className="size-5 text-primary" strokeWidth={1.6} />
            {PLUS_NAME}
          </SheetTitle>
          <SheetDescription>{PLUS_TAGLINE}</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6">
          {copy ? (
            <div className="mb-5 rounded-2xl bg-surface/70 px-4 py-4">
              <p className="text-[15px] font-medium">{copy.title}</p>
              {copy.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
              ) : null}
            </div>
          ) : null}

          <p className="font-display text-[26px] leading-tight">
            {localizedPrice ? `${localizedPrice}／月` : PLUS_PRICE_LABEL}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            每月自動續訂，可隨時於 Apple ID 訂閱設定取消。
          </p>

          <ul className="mt-4 grid grid-cols-1 gap-2">
            {PLUS_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={2} />

                <div>
                  <div>{b}</div>

                  {b.includes("進階提醒") ? (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground/80">
                      含追星天氣、準備提醒、自訂時間與個性化提醒語氣
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          {message ? (
            <p className="mt-4 text-center text-xs text-muted-foreground">{message}</p>
          ) : null}

          <button
            type="button"
            onClick={handleSubscribe}
            disabled={isPurchasing || isRestoring}
            className="mt-6 w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPurchasing ? "正在連接 Apple…" : PLUS_CTA}
          </button>

          <button
            type="button"
            onClick={handleRestorePurchases}
            disabled={isPurchasing || isRestoring}
            className="mt-2 w-full rounded-full px-6 py-2.5 text-sm font-medium text-primary transition-colors active:bg-surface/70 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRestoring ? "正在恢復購買…" : "恢復購買"}
          </button>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPurchasing || isRestoring}
            className="mt-1 w-full rounded-full px-6 py-2.5 text-sm text-muted-foreground transition-colors active:bg-surface/70 disabled:opacity-60"
          >
            {PLUS_SECONDARY_CTA}
          </button>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
            訂閱將由 Apple ID 帳號扣款，並會在目前訂閱期結束前 24 小時內自動續訂。
            <br />
            <a
              href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              使用條款
            </a>
            <span aria-hidden> ・ </span>
            <a href="/privacy" className="underline">
              隱私權政策
            </a>
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
