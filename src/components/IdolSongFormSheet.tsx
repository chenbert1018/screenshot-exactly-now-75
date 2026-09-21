import { useEffect, useState } from "react";
import { ExternalLink, Link2, LoaderCircle, Music2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  emptyIdolSongDraft,
  type IdolSongDraft,
} from "@/lib/idol-music";
import {
  detectMusicLinkProvider,
  type MusicLinkMetadata,
} from "@/lib/music-link-metadata";
import { resolveMusicLink } from "@/lib/music-link-metadata.functions";

export function IdolSongFormSheet({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: IdolSongDraft) => Promise<void>;
}) {
  const [draft, setDraft] =
    useState<IdolSongDraft>(emptyIdolSongDraft);
  const [musicUrl, setMusicUrl] = useState("");
  const [metadata, setMetadata] =
    useState<MusicLinkMetadata | null>(null);
  const [resolving, setResolving] = useState(false);
  const [linkMessage, setLinkMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setDraft(emptyIdolSongDraft);
    setMusicUrl("");
    setMetadata(null);
    setResolving(false);
    setLinkMessage("");
    setSaving(false);
    setError("");
  }, [open]);

  async function autofillFromLink(value: string) {
    const url = value.trim();

    if (!url) {
      setMetadata(null);
      setLinkMessage("");
      return;
    }

    const provider = detectMusicLinkProvider(url);

    if (!provider) {
      setMetadata(null);
      setLinkMessage(
        "目前支援 Apple Music 或 Spotify 歌曲連結",
      );
      return;
    }

    setResolving(true);
    setMetadata(null);
    setLinkMessage("");
    setError("");

    try {
      const result = await resolveMusicLink({
        data: { url },
      });

      setMetadata(result);

      setDraft((current) => ({
        ...current,
        title: result.title || current.title,
        artist: result.artist || current.artist,
        album: result.album || current.album,
        appleMusicUrl:
          result.provider === "apple-music"
            ? result.url
            : current.appleMusicUrl,
        spotifyUrl:
          result.provider === "spotify"
            ? result.url
            : current.spotifyUrl,
      }));

      if (result.title) {
        setLinkMessage(
          result.provider === "spotify"
            ? "已從 Spotify 帶入歌曲資料 ♡"
            : "已從 Apple Music 帶入歌曲資料 ♡",
        );
      } else {
        setLinkMessage("已加入歌曲連結");
      }
    } catch (reason) {
      console.error(
        "[IdolDays music link metadata]",
        reason,
      );
      setLinkMessage(
        "沒有讀到歌曲資料，仍可以在下方手動填寫",
      );
    } finally {
      setResolving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-border/60 bg-card px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="px-0 text-left">
          <p className="text-[13px] font-semibold tracking-[0.14em] text-primary">
            OUR SONGS ♡
          </p>

          <SheetTitle className="font-display text-[22px]">
            加進我們的歌
          </SheetTitle>

          <SheetDescription>
            貼上 Apple Music 或 Spotify 連結，IdolDays
            會先幫你整理歌曲資料。
          </SheetDescription>
        </SheetHeader>

        <form
          className="space-y-4 pt-2"
          onSubmit={async (event) => {
            event.preventDefault();

            if (!draft.title.trim()) {
              setError("請填寫歌名");
              return;
            }

            setSaving(true);
            setError("");

            try {
              await onSubmit(draft);
              onOpenChange(false);
            } catch (reason) {
              console.error(
                "[IdolDays song save]",
                reason,
              );
              setError(
                "歌曲沒有儲存成功，請稍後再試一次",
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="music-link">
              歌曲連結
            </Label>

            <div className="relative">
              <Link2
                className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.7}
              />

              <Input
                id="music-link"
                type="url"
                value={musicUrl}
                onChange={(event) => {
                  setMusicUrl(event.target.value);
                  setLinkMessage("");
                  setMetadata(null);
                }}
                onPaste={(event) => {
                  const pasted =
                    event.clipboardData.getData("text");

                  if (!pasted.trim()) return;

                  setMusicUrl(pasted.trim());

                  window.setTimeout(() => {
                    void autofillFromLink(pasted);
                  }, 0);
                }}
                onBlur={() => {
                  if (
                    musicUrl.trim() &&
                    !metadata &&
                    !resolving
                  ) {
                    void autofillFromLink(musicUrl);
                  }
                }}
                placeholder="貼上 Apple Music 或 Spotify 連結"
                className="min-h-12 rounded-2xl bg-surface/50 pl-10 pr-10"
              />

              {resolving ? (
                <LoaderCircle
                  className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-primary"
                  strokeWidth={1.8}
                />
              ) : null}
            </div>

            {resolving ? (
              <p className="text-sm text-primary">
                ✦ 正在讀取歌曲資料…
              </p>
            ) : linkMessage ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {linkMessage}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                貼上連結後，會自動辨識音樂平台。
              </p>
            )}
          </div>

          {metadata?.title ? (
            <div className="flex items-center gap-3 rounded-[1.35rem] border border-border/60 bg-surface/45 p-3">
              {metadata.artworkUrl ? (
                <img
                  src={metadata.artworkUrl}
                  alt=""
                  className="size-14 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Music2
                    className="size-5"
                    strokeWidth={1.6}
                  />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-medium">
                  {metadata.title}
                </p>

                <p className="mt-1 text-[10px] font-semibold tracking-[0.12em] text-primary">
                  {metadata.provider === "spotify"
                    ? "SPOTIFY ♡"
                    : "APPLE MUSIC ♡"}
                </p>
              </div>

              <a
                href={metadata.url}
                target="_blank"
                rel="noreferrer"
                aria-label="開啟歌曲連結"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground"
              >
                <ExternalLink
                  className="size-4"
                  strokeWidth={1.7}
                />
              </a>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="song-title">
              歌名
              <span className="ml-1 text-primary">*</span>
            </Label>

            <Input
              id="song-title"
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="例如：Run Away"
              className="rounded-xl bg-surface/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="song-artist">
              歌手／團體
            </Label>

            <Input
              id="song-artist"
              value={draft.artist}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  artist: event.target.value,
                }))
              }
              placeholder="例如：MIYEON"
              className="rounded-xl bg-surface/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="song-album">
              專輯
            </Label>

            <Input
              id="song-album"
              value={draft.album}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  album: event.target.value,
                }))
              }
              placeholder="可略過"
              className="rounded-xl bg-surface/50"
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-full border border-border/70 py-3 text-sm"
            >
              取消
            </button>

            <button
              type="submit"
              disabled={saving || resolving}
              className="flex-1 rounded-full bg-primary min-h-[50px] py-3 text-base font-medium text-primary-foreground shadow-soft disabled:opacity-60"
            >
              {saving ? "儲存中…" : "加入歌曲"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
