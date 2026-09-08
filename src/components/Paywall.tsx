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
  const { subscribe } = useSubscription();
  const copy = feature ? PREMIUM_FEATURE_COPY[feature] : null;

  function handleSubscribe() {
    subscribe();
    onOpenChange(false);
    onSubscribed?.();
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

          <p className="font-display text-[26px] leading-tight">{PLUS_PRICE_LABEL}</p>

          <ul className="mt-4 grid grid-cols-1 gap-2">
            {PLUS_BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="size-4 text-primary" strokeWidth={2} />
                {b}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handleSubscribe}
            className="mt-6 w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
          >
            {PLUS_CTA}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="mt-3 w-full rounded-full px-6 py-2.5 text-sm text-muted-foreground transition-colors active:bg-surface/70"
          >
            {PLUS_SECONDARY_CTA}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
