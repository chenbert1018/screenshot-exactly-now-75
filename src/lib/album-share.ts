import { useCallback, useEffect, useState } from "react";

/**
 * 相簿（回憶資料夾）分享設定。
 * 目前後端沒有分享相關欄位，因此本階段只在這台裝置保存設定（不改 Supabase schema）。
 * 設定只作用於單一本相簿，不會影響其他資料。
 */

export type AlbumShareMode = "PRIVATE" | "INVITED" | "PUBLIC";

export type AlbumShare = {
  mode: AlbumShareMode;
  /** 指定分享對象（只讀權限） */
  recipients: string[];
  /** 公開分享連結的隨機代碼 */
  publicToken?: string;
};

export const ALBUM_SHARE_KEY = "idoldays.albumShare.v1";

export const defaultAlbumShare: AlbumShare = { mode: "PRIVATE", recipients: [] };

type Store = Record<string, AlbumShare>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ALBUM_SHARE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  try {
    window.localStorage.setItem(ALBUM_SHARE_KEY, JSON.stringify(store));
  } catch {
    /* 儲存空間不可用時忽略 */
  }
}

export function getAlbumShare(folderId: string): AlbumShare {
  return readStore()[folderId] ?? defaultAlbumShare;
}

export function makeShareToken(): string {
  const bytes = new Uint8Array(12);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function shareLinkFor(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/shared/${token}`;
}

/** 單一本相簿的分享設定 */
export function useAlbumShare(folderId: string) {
  const [share, setShare] = useState<AlbumShare>(defaultAlbumShare);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setShare(getAlbumShare(folderId));
    setReady(true);
  }, [folderId]);

  const save = useCallback(
    (next: AlbumShare) => {
      const store = readStore();
      store[folderId] = next;
      writeStore(store);
      setShare(next);
    },
    [folderId],
  );

  const setMode = useCallback(
    (mode: AlbumShareMode) => {
      const current = getAlbumShare(folderId);
      if (mode === "PUBLIC") {
        save({ ...current, mode, publicToken: current.publicToken ?? makeShareToken() });
        return;
      }
      save({ ...current, mode });
    },
    [folderId, save],
  );

  const addRecipient = useCallback(
    (value: string) => {
      const name = value.trim();
      if (!name) return;
      const current = getAlbumShare(folderId);
      if (current.recipients.includes(name)) return;
      save({ ...current, recipients: [...current.recipients, name] });
    },
    [folderId, save],
  );

  const removeRecipient = useCallback(
    (value: string) => {
      const current = getAlbumShare(folderId);
      save({ ...current, recipients: current.recipients.filter((r) => r !== value) });
    },
    [folderId, save],
  );

  const regenerateLink = useCallback(() => {
    const current = getAlbumShare(folderId);
    save({ ...current, publicToken: makeShareToken() });
  }, [folderId, save]);

  return { share, ready, setMode, addRecipient, removeRecipient, regenerateLink };
}
