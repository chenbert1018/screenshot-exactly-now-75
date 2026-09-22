export const COLLECTION_CATEGORIES = ["ALBUM","PHOTOCARD","MERCH","TICKET","LIGHTSTICK","OTHER"] as const;
export type CollectionCategory = (typeof COLLECTION_CATEGORIES)[number];
export type CollectionOrigin = "USER" | "OFFICIAL" | "PARTNER";
export type CollectionProvenance = "UNSPECIFIED" | "OFFICIAL" | "FAN_MADE" | "MADE_BY_ME" | "GIFT_TRADE";
export const COLLECTION_PROVENANCE_OPTIONS:ReadonlyArray<{value:CollectionProvenance;label:string;emoji:string}> = [
 {value:"UNSPECIFIED",label:"不特別標示",emoji:"♡"},{value:"OFFICIAL",label:"官方",emoji:"✦"},{value:"FAN_MADE",label:"飯制應援物",emoji:"💝"},{value:"MADE_BY_ME",label:"自己製作",emoji:"🎀"},{value:"GIFT_TRADE",label:"交換／朋友贈送",emoji:"🤝"},
];
export type CollectionItem = {
  id:string; idolId?:string; eventId?:string; category:CollectionCategory; provenance?:CollectionProvenance; title:string; photo?:string;
  acquiredDate?:string; source?:string; note?:string; favorite:boolean; origin:CollectionOrigin; createdAt:string;
};
export type CollectionDraft = Omit<CollectionItem,"id"|"createdAt"|"origin">;
export const collectionCategoryMeta:Record<CollectionCategory,{emoji:string;label:string}> = {
  ALBUM:{emoji:"💿",label:"專輯"}, PHOTOCARD:{emoji:"🪪",label:"小卡"}, MERCH:{emoji:"🛍️",label:"周邊"},
  TICKET:{emoji:"🎫",label:"票根"}, LIGHTSTICK:{emoji:"💡",label:"應援棒"}, OTHER:{emoji:"♡",label:"其他收藏"},
};
