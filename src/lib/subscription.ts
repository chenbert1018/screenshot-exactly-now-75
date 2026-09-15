import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import {
  getIdolDaysPlusEntitlement,
  getIdolDaysPlusProduct,
  isStoreKitAvailable,
  purchaseIdolDaysPlus,
  restoreIdolDaysPlus,
} from "./storekit-native";

/**
 * IdolDays+ 訂閱狀態（只有三種，沒有試用）。
 * FREE：免費版；ACTIVE：訂閱中；EXPIRED：曾訂閱但已到期（等同 FREE 權限）。
 */
export type SubscriptionStatus = "FREE" | "ACTIVE" | "EXPIRED";

export type SubscriptionState = {
  status: SubscriptionStatus;
  /** 訂閱開始時間（ISO），FREE 時為 null */
  startedAt: string | null;
};

const STORAGE_KEY = "idoldays.subscription.v1";

export const defaultSubscription: SubscriptionState = {
  status: "FREE",
  startedAt: null,
};

/** 唯一正式價格 */
export const PLUS_PRICE_LABEL = "NT$90／月";
export const PLUS_NAME = "IdolDays+";
export const PLUS_TAGLINE = "解鎖完整追星體驗 ♡";
export const PLUS_CTA = "訂閱 IdolDays+";
export const PLUS_SECONDARY_CTA = "先不用";

/** 偶像數量上限 */
export const FREE_IDOL_LIMIT = 1;
export const PLUS_IDOL_LIMIT = 6;

/** IdolDays+ 解鎖項目（Paywall 清單） */
export const PLUS_BENEFITS = [
  "👤 最多 6 位偶像",
  "📱 專屬桌面小工具",
  "💌 私人相簿分享",
  "🔔 追星天氣與進階提醒",
] as const;

export type PremiumFeature =
  | "IDOL_SLOT"
  | "PREMIUM_THEME"
  | "PREMIUM_WIDGET"
  | "MEMORY_PLUS"
  | "MEMORY_SHARE"
  | "SUGAR_PLUS"
  | "CUSTOM_REMINDER"
  | "PREMIUM_COMPANION";

/** 各 Premium 功能的 Paywall 文案 */
export const PREMIUM_FEATURE_COPY: Record<PremiumFeature, { title: string; description: string }> =
  {
    IDOL_SLOT: {
      title: "想收藏更多本命嗎？♡",
      description: "IdolDays+ 最多可以收藏 6 位偶像。",
    },
    PREMIUM_THEME: {
      title: "換一個更像你的追星基地。",
      description: "",
    },
    PREMIUM_WIDGET: {
      title: "讓本命每天都出現在你的桌面。",
      description: "",
    },
    MEMORY_PLUS: {
      title: "把一路追星的日子，整理成一本年鑑。",
      description: "",
    },
    MEMORY_SHARE: {
      title: "這段回憶，只想和一起經歷的人分享。",
      description: "",
    },
    SUGAR_PLUS: {
      title: "這顆糖值得收藏得更完整。",
      description: "",
    },
    CUSTOM_REMINDER: {
      title: "重要的日子，不想錯過。",
      description: "",
    },
    PREMIUM_COMPANION: {
      title: "每天多一點陪伴。",
      description: "",
    },
  };

export function isPlusActive(state: SubscriptionState): boolean {
  return state.status === "ACTIVE";
}

export function idolLimitFor(state: SubscriptionState): number {
  return isPlusActive(state) ? PLUS_IDOL_LIMIT : FREE_IDOL_LIMIT;
}

function read(): SubscriptionState {
  if (typeof window === "undefined") return defaultSubscription;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSubscription;
    const parsed = JSON.parse(raw) as Partial<SubscriptionState>;
    const status: SubscriptionStatus =
      parsed.status === "ACTIVE" || parsed.status === "EXPIRED" ? parsed.status : "FREE";
    return { status, startedAt: parsed.startedAt ?? null };
  } catch {
    return defaultSubscription;
  }
}

function write(value: SubscriptionState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

const listeners = new Set<(s: SubscriptionState) => void>();

function emit(value: SubscriptionState) {
  listeners.forEach((fn) => fn(value));
}

export function useSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>(defaultSubscription);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [localizedPrice, setLocalizedPrice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const localState = read();
    setState(localState);

    const fn = (s: SubscriptionState) => setState(s);
    listeners.add(fn);

    const syncEntitlement = async () => {
      if (!isStoreKitAvailable()) {
        if (!cancelled) setReady(true);
        return;
      }

      try {
        const entitlement = await getIdolDaysPlusEntitlement();

        if (cancelled) return;

        const next: SubscriptionState = {
          status: entitlement.active
            ? "ACTIVE"
            : localState.status === "ACTIVE"
              ? "EXPIRED"
              : localState.status,
          startedAt: entitlement.active ? (localState.startedAt ?? new Date().toISOString()) : null,
        };

        write(next);
        emit(next);
      } catch (error) {
        console.error("IdolDays+ entitlement check failed", error);
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    void syncEntitlement();
    void getIdolDaysPlusProduct()
      .then((product) => {
        if (!cancelled) setLocalizedPrice(product.displayPrice);
      })
      .catch(() => {
        if (!cancelled) setLocalizedPrice(null);
      });

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void syncEntitlement();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      cancelled = true;
      listeners.delete(fn);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  // 管理員由資料庫角色決定；不在前端硬編碼任何 email。
  useEffect(() => {
    let cancelled = false;

    async function loadAdminRole() {
      if (!user?.id) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase.rpc("is_admin" as never);

      if (!cancelled) setIsAdmin(!error && Boolean(data));
    }

    void loadAdminRole();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const setStatus = useCallback((status: SubscriptionStatus) => {
    const next: SubscriptionState = {
      status,
      startedAt: status === "ACTIVE" ? new Date().toISOString() : null,
    };
    write(next);
    emit(next);
  }, []);

  /** 透過 Apple StoreKit 訂閱 IdolDays+ */
  const subscribe = useCallback(async () => {
    if (!isStoreKitAvailable()) {
      return {
        status: "unavailable" as const,
        active: false,
      };
    }

    const result = await purchaseIdolDaysPlus();

    if (result.status === "purchased" && result.active) {
      setStatus("ACTIVE");
    }

    return result;
  }, [setStatus]);

  /** 恢復 Apple 購買 */
  const restorePurchases = useCallback(async () => {
    if (!isStoreKitAvailable()) {
      return { active: false };
    }

    const result = await restoreIdolDaysPlus();

    setStatus(result.active ? "ACTIVE" : "EXPIRED");

    return result;
  }, [setStatus]);

  const expire = useCallback(() => setStatus("EXPIRED"), [setStatus]);

  return {
    ...state,
    ready,
    isAdmin,
    isPlus: isPlusActive(state) || isAdmin,
    idolLimit: isPlusActive(state) || isAdmin ? PLUS_IDOL_LIMIT : FREE_IDOL_LIMIT,
    subscribe,
    restorePurchases,
    expire,
    setStatus,
    localizedPrice,
  };
}
