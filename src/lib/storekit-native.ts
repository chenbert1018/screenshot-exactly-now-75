import { Capacitor, registerPlugin } from "@capacitor/core";

export const IDOLDAYS_PLUS_PRODUCT_ID = "com.idoldays.plus.monthly";

export type StoreKitPurchaseResult = {
  status: "purchased" | "pending" | "cancelled";
  active: boolean;
  productId?: string;
  expirationDate?: string;
};

export type StoreKitEntitlement = {
  active: boolean;
  productId?: string;
  expirationDate?: string;
};

export type StoreKitProduct = {
  productId: string;
  displayName: string;
  description: string;
  displayPrice: string;
};

interface IdolDaysStoreKitPlugin {
  product(options: { productId: string }): Promise<StoreKitProduct>;
  purchase(options: { productId: string }): Promise<StoreKitPurchaseResult>;
  restore(options: { productId: string }): Promise<StoreKitEntitlement>;
  entitlement(options: { productId: string }): Promise<StoreKitEntitlement>;
}

const StoreKit = registerPlugin<IdolDaysStoreKitPlugin>("IdolDaysStoreKit");

export function isStoreKitAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

export function purchaseIdolDaysPlus(): Promise<StoreKitPurchaseResult> {
  return StoreKit.purchase({ productId: IDOLDAYS_PLUS_PRODUCT_ID });
}

export function getIdolDaysPlusProduct(): Promise<StoreKitProduct> {
  return StoreKit.product({ productId: IDOLDAYS_PLUS_PRODUCT_ID });
}

export function restoreIdolDaysPlus(): Promise<StoreKitEntitlement> {
  return StoreKit.restore({ productId: IDOLDAYS_PLUS_PRODUCT_ID });
}

export function getIdolDaysPlusEntitlement(): Promise<StoreKitEntitlement> {
  return StoreKit.entitlement({ productId: IDOLDAYS_PLUS_PRODUCT_ID });
}
