import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * 雲端照片（Supabase Storage）集中處理層。
 *
 * - private bucket：idoldays-media
 * - path 一律是 {user_id}/{kind}/{record_id}/{filename}
 * - 雲端資料表欄位存放 storage reference（storage:<path>），不存 public URL
 * - 顯示時統一由這裡換成 signed URL（component 不直接碰 Storage API）
 *
 * 本檔案不改變任何既有業務邏輯，也不會刪除本機照片。
 */

export const MEDIA_BUCKET = "idoldays-media";

const REF_PREFIX = "storage:";
const SIGNED_TTL_SECONDS = 60 * 60; // 1 小時
const SIGNED_CACHE_MS = 50 * 60 * 1000;

export type MediaKind = "idols" | "memories" | "sugar";

/* ------------------------------ reference ------------------------------ */

/** 是否已經是 Storage reference（storage:<path>） */
export function isStorageRef(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(REF_PREFIX);
}

/** 是否為可直接上傳的 dataURL 圖片 */
export function isDataUrl(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith("data:image/");
}

export function toStorageRef(path: string): string {
  return `${REF_PREFIX}${path}`;
}

export function storageRefToPath(value: string): string {
  return isStorageRef(value) ? value.slice(REF_PREFIX.length) : value;
}

export function buildStoragePath(
  userId: string,
  kind: MediaKind,
  recordId: string,
  filename: string,
): string {
  return `${userId}/${kind}/${recordId}/${filename}`;
}

/* ------------------------------ dataURL ------------------------------ */

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/avif": "avif",
};

export type ParsedDataUrl = { blob: Blob; contentType: string; ext: string };

/** dataURL → Blob；無法解析時回傳 null（呼叫端只記 warning，不覆蓋原資料） */
export function dataUrlToBlob(value: string): ParsedDataUrl | null {
  try {
    if (!isDataUrl(value)) return null;
    const commaAt = value.indexOf(",");
    if (commaAt < 0) return null;
    const header = value.slice(5, commaAt); // e.g. image/png;base64
    const isBase64 = header.includes(";base64");
    const contentType = header.split(";")[0] || "image/png";
    const payload = value.slice(commaAt + 1);
    if (!payload) return null;

    let bytes: Uint8Array<ArrayBuffer>;
    if (isBase64) {
      const binary = atob(payload);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    } else {
      bytes = new TextEncoder().encode(decodeURIComponent(payload)) as Uint8Array<ArrayBuffer>;
    }
    if (bytes.byteLength === 0) return null;

    return {
      blob: new Blob([bytes], { type: contentType }),
      contentType,
      ext: EXT_BY_MIME[contentType] ?? "img",
    };
  } catch {
    return null;
  }
}

/* ------------------------------- upload -------------------------------- */

/**
 * 上傳一張圖片到 {user_id}/{kind}/{record_id}/photo.<ext>。
 *
 * - 固定檔名 + upsert：同一筆資料重跑 migration 不會產生 image-1 / image-2
 * - 無法解析 dataURL 時回傳 null（呼叫端保留原資料並記 warning）
 */
export async function uploadImage(
  userId: string,
  kind: MediaKind,
  recordId: string,
  dataUrl: string,
): Promise<string | null> {
  const parsed = dataUrlToBlob(dataUrl);
  if (!parsed) return null;

  const path = buildStoragePath(userId, kind, recordId, `photo.${parsed.ext}`);
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, parsed.blob, {
    contentType: parsed.contentType,
    upsert: true,
  });
  if (error) throw error;
  return toStorageRef(path);
}

/** 這個 record 底下是否已經有上傳過的圖片（避免重複上傳） */
export async function findExistingImage(
  userId: string,
  kind: MediaKind,
  recordId: string,
): Promise<string | null> {
  const prefix = `${userId}/${kind}/${recordId}`;
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).list(prefix, { limit: 1 });
  if (error) return null;
  const first = data?.[0];
  return first ? toStorageRef(`${prefix}/${first.name}`) : null;
}

/** 刪除一張圖片（只允許自己的 path；失敗時保留 orphan，不影響產品流程） */
export async function removeImage(ref: string): Promise<void> {
  if (!isStorageRef(ref)) return;
  await supabase.storage.from(MEDIA_BUCKET).remove([storageRefToPath(ref)]);
}

/* ----------------------------- signed URL ----------------------------- */

const signedCache = new Map<string, { url: string; at: number }>();
const signedInflight = new Map<string, Promise<string | null>>();

/** 取得可顯示的 URL；dataURL / http 直接沿用，Storage reference 換成 signed URL */
export async function resolveImageUrl(value: string | null | undefined): Promise<string> {
  if (!value) return "";
  if (!isStorageRef(value)) return value;

  const path = storageRefToPath(value);
  const cached = signedCache.get(path);
  if (cached && Date.now() - cached.at < SIGNED_CACHE_MS) return cached.url;

  const running = signedInflight.get(path);
  if (running) return (await running) ?? "";

  const task = (async () => {
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrl(path, SIGNED_TTL_SECONDS);
    if (error || !data?.signedUrl) return null;
    signedCache.set(path, { url: data.signedUrl, at: Date.now() });
    return data.signedUrl;
  })().finally(() => signedInflight.delete(path));

  signedInflight.set(path, task);
  return (await task) ?? "";
}

/** React 端統一入口：把任何照片值換成可顯示的 src */
export function useImageSrc(value: string | null | undefined): string {
  const [src, setSrc] = useState(() => (isStorageRef(value) ? "" : (value ?? "")));

  useEffect(() => {
    let active = true;
    if (!value) {
      setSrc("");
      return;
    }
    if (!isStorageRef(value)) {
      setSrc(value);
      return;
    }
    setSrc("");
    void resolveImageUrl(value).then((url) => {
      if (active) setSrc(url);
    });
    return () => {
      active = false;
    };
  }, [value]);

  return src;
}
