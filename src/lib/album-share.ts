import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AlbumShareMode = "PRIVATE" | "INVITED" | "PUBLIC";
export type AlbumShare = { mode: AlbumShareMode; recipients: string[]; publicToken?: string };
export const defaultAlbumShare: AlbumShare = { mode: "PRIVATE", recipients: [] };

export type AlbumShareCodePreview = {
  shareId: string;
  shareTitle: string;
  shareMessage?: string;
  folderTitle: string;
  memoryCount: number;
};

export type AlbumShareClaim = {
  shareId: string;
  folderId: string;
  shareTitle: string;
  shareMessage?: string;
  importedMemoryCount: number;
};

type ShareRow = { id: string; mode: AlbumShareMode; public_token: string | null };
type RecipientRow = { recipient_email: string };
type RpcResponse<T> = { data: T | null; error: { message?: string } | null };
type ShareRpc = <T>(name: string, args: Record<string, unknown>) => PromiseLike<RpcResponse<T>>;

function asShare(mode: AlbumShareMode, recipients: string[], publicToken: string | null | undefined): AlbumShare {
  return publicToken ? { mode, recipients, publicToken } : { mode, recipients };
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "分享設定儲存失敗，請稍後再試。";
}
function rpcMessage(error: { message?: string } | null, fallback: string) {
  const raw = error?.message?.toLowerCase() ?? "";
  if (raw.includes("authentication required")) return "請先登入 IdolDays 再使用分享碼。";
  if (raw.includes("invalid share code")) return "分享碼格式不正確，請再確認一次。";
  if (raw.includes("share code not found")) return "找不到這組分享碼，可能已失效或被取消。";
  if (raw.includes("cannot claim your own share")) return "這是你自己的分享碼 ♡";
  if (raw.includes("shared folder no longer exists")) return "這份收藏已經不存在了。";
  return error?.message || fallback;
}
function normalizeEmail(value: string) { return value.trim().toLowerCase(); }
export function normalizeShareCode(value: string) {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  return compact.length > 4 ? `${compact.slice(0, 4)}-${compact.slice(4)}` : compact;
}
export function isValidShareEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}
export function makeShareToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
export function shareLinkFor(token: string): string {
  return `${typeof window !== "undefined" ? window.location.origin : ""}/shared/${token}`;
}

async function callShareRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const rpc = supabase.rpc.bind(supabase) as unknown as ShareRpc;
  const { data, error } = await rpc<T>(name, args);
  if (error) throw new Error(rpcMessage(error, "分享功能暫時無法使用，請稍後再試。"));
  if (data == null) throw new Error("沒有收到分享資料，請稍後再試。");
  return data;
}

export async function enableAlbumShareCode(input: {
  folderId: string;
  title?: string;
  message?: string;
}) {
  const rows = await callShareRpc<Array<{ share_id: string; share_code: string }>>(
    "enable_album_share_code",
    {
      p_folder_id: input.folderId,
      p_title: input.title?.trim() || null,
      p_message: input.message?.trim() || null,
    },
  );
  const row = rows[0];
  if (!row?.share_code) throw new Error("分享碼沒有產生成功，請再試一次。");
  return { shareId: row.share_id, shareCode: row.share_code };
}

export async function previewAlbumShareCode(code: string): Promise<AlbumShareCodePreview> {
  const rows = await callShareRpc<Array<{
    share_id: string;
    share_title: string;
    share_message: string | null;
    folder_title: string;
    memory_count: number | string;
  }>>("preview_album_share_code", { p_code: normalizeShareCode(code) });
  const row = rows[0];
  if (!row) throw new Error("找不到這組分享碼，可能已失效或被取消。");
  return {
    shareId: row.share_id,
    shareTitle: row.share_title,
    ...(row.share_message ? { shareMessage: row.share_message } : {}),
    folderTitle: row.folder_title,
    memoryCount: Number(row.memory_count) || 0,
  };
}

export async function claimAlbumShareCode(code: string): Promise<AlbumShareClaim> {
  const rows = await callShareRpc<Array<{
    share_id: string;
    folder_id: string;
    share_title: string;
    share_message: string | null;
    imported_memory_count: number | string;
  }>>("claim_album_share_code", { p_code: normalizeShareCode(code) });
  const row = rows[0];
  if (!row?.folder_id) throw new Error("收藏沒有收進來，請再試一次。");
  return {
    shareId: row.share_id,
    folderId: row.folder_id,
    shareTitle: row.share_title,
    ...(row.share_message ? { shareMessage: row.share_message } : {}),
    importedMemoryCount: Number(row.imported_memory_count) || 0,
  };
}

async function userId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("請先登入後再設定分享。");
  return data.user.id;
}
async function readShare(folderId: string): Promise<AlbumShare> {
  const { data, error } = await supabase.from("album_shares").select("id, mode, public_token").eq("folder_id", folderId).maybeSingle();
  if (error) throw error;
  if (!data) return defaultAlbumShare;
  const share = data as ShareRow;
  const { data: recipients, error: recipientsError } = await supabase.from("album_share_recipients").select("recipient_email").eq("share_id", share.id).order("created_at");
  if (recipientsError) throw recipientsError;
  return asShare(share.mode, (recipients ?? []).map((r) => (r as RecipientRow).recipient_email), share.public_token);
}
async function saveShare(folderId: string, mode: AlbumShareMode, publicToken: string | null) {
  const { data, error } = await supabase.from("album_shares").upsert({ folder_id: folderId, user_id: await userId(), mode, public_token: publicToken }, { onConflict: "folder_id" }).select("id, mode, public_token").single();
  if (error) throw error;
  return data as ShareRow;
}

/** Cloud-backed owner settings for exactly one memory folder. */
export function useAlbumShare(folderId: string) {
  const [share, setShare] = useState<AlbumShare>(defaultAlbumShare);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const queue = useRef(Promise.resolve());

  const reload = useCallback(async () => {
    setReady(false);
    try { setShare(await readShare(folderId)); setError(null); }
    catch (cause) { setError(message(cause)); }
    finally { setReady(true); }
  }, [folderId]);
  useEffect(() => { void reload(); }, [reload]);
  const mutate = useCallback(<T,>(task: () => Promise<T>) => {
    setPendingCount((count) => count + 1);
    const next = queue.current.then(task, task);
    queue.current = next.then(() => undefined, () => undefined);
    return next.finally(() => setPendingCount((count) => Math.max(0, count - 1)));
  }, []);
  const fail = useCallback((cause: unknown): never => { const text = message(cause); setError(text); throw new Error(text); }, []);

  const setMode = useCallback((mode: AlbumShareMode) => mutate(async () => {
    const before = await readShare(folderId);
    const publicToken = mode === "PUBLIC" ? (before.publicToken ?? makeShareToken()) : null;
    await saveShare(folderId, mode, publicToken);
    const next = asShare(mode, before.recipients, publicToken);
    setShare(next); setError(null); return next;
  }).catch(fail), [fail, folderId, mutate]);

  const addRecipient = useCallback((value: string) => mutate(async () => {
    const email = normalizeEmail(value);
    if (!isValidShareEmail(email)) throw new Error("請輸入有效的 Email。");
    const current = await readShare(folderId);
    const row = await saveShare(folderId, "INVITED", null);
    const { error: insertError } = await supabase.from("album_share_recipients").upsert({ share_id: row.id, recipient_email: email }, { onConflict: "share_id,recipient_email" });
    if (insertError) throw insertError;
    const next = asShare("INVITED", [...new Set([...current.recipients, email])], null);
    setShare(next); setError(null); return next;
  }).catch(fail), [fail, folderId, mutate]);

  const removeRecipient = useCallback((value: string) => mutate(async () => {
    const email = normalizeEmail(value);
    const current = await readShare(folderId);
    const { data: row, error: shareError } = await supabase.from("album_shares").select("id").eq("folder_id", folderId).maybeSingle();
    if (shareError) throw shareError;
    if (row) {
      const { error: deleteError } = await supabase.from("album_share_recipients").delete().eq("share_id", row.id).eq("recipient_email", email);
      if (deleteError) throw deleteError;
    }
    const next = { ...current, recipients: current.recipients.filter((recipient) => recipient !== email) };
    setShare(next); setError(null); return next;
  }).catch(fail), [fail, folderId, mutate]);

  const regenerateLink = useCallback(() => mutate(async () => {
    const current = await readShare(folderId);
    if (current.mode !== "PUBLIC") throw new Error("請先啟用公開分享。");
    const publicToken = makeShareToken();
    await saveShare(folderId, "PUBLIC", publicToken);
    const next = asShare("PUBLIC", current.recipients, publicToken);
    setShare(next); setError(null); return next;
  }).catch(fail), [fail, folderId, mutate]);

  return { share, ready, loading: pendingCount > 0, error, setMode, addRecipient, removeRecipient, regenerateLink, reload };
}
