export const COLLECTION_CATEGORIES = ["ALBUM","PHOTOCARD","MERCH","TICKET","LIGHTSTICK","OTHER"] as const;
export type CollectionCategory = (typeof COLLECTION_CATEGORIES)[number];
export type CollectionOrigin = "USER" | "OFFICIAL" | "PARTNER";
export type CollectionItem = {
  id:string; idolId?:string; eventId?:string; category:CollectionCategory; title:string; photo?:string;
  acquiredDate?:string; source?:string; note?:string; favorite:boolean; origin:CollectionOrigin; createdAt:string;
};
export type CollectionDraft = Omit<CollectionItem,"id"|"createdAt"|"origin">;
export const collectionCategoryMeta:Record<CollectionCategory,{emoji:string;label:string}> = {
  ALBUM:{emoji:"💿",label:"專輯"}, PHOTOCARD:{emoji:"🪪",label:"小卡"}, MERCH:{emoji:"🛍️",label:"周邊"},
  TICKET:{emoji:"🎫",label:"票根"}, LIGHTSTICK:{emoji:"💡",label:"應援棒"}, OTHER:{emoji:"♡",label:"其他收藏"},
};
