import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emptyIdolSongDraft, type IdolSongDraft } from "@/lib/idol-music";

export function IdolSongFormSheet({ open, onOpenChange, onSubmit }: {
  open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (draft: IdolSongDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<IdolSongDraft>(emptyIdolSongDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (open) { setDraft(emptyIdolSongDraft); setSaving(false); setError(""); } }, [open]);
  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" className="mx-auto max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-border/60 bg-card px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <SheetHeader className="px-0 text-left"><SheetTitle className="text-xl">加進我們的歌 🎧</SheetTitle><SheetDescription>只記下你的歌曲與合法串流連結，不會保存音檔。</SheetDescription></SheetHeader>
      <form className="space-y-4 pt-2" onSubmit={async (event) => { event.preventDefault(); if (!draft.title.trim()) { setError("請填寫歌名"); return; } setSaving(true); setError(""); try { await onSubmit(draft); onOpenChange(false); } catch { setError("歌曲沒有儲存成功，請確認網路後再試一次"); } finally { setSaving(false); } }}>
        <div className="space-y-1.5"><Label htmlFor="song-title">歌名 <span className="text-primary">*</span></Label><Input id="song-title" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="例如：Song Title" className="rounded-xl bg-surface/50" /></div>
        <div className="space-y-1.5"><Label htmlFor="song-artist">歌手／團體</Label><Input id="song-artist" value={draft.artist} onChange={(e) => setDraft((d) => ({ ...d, artist: e.target.value }))} placeholder="例如：Miyeon" className="rounded-xl bg-surface/50" /></div>
        <div className="space-y-1.5"><Label htmlFor="song-album">專輯</Label><Input id="song-album" value={draft.album} onChange={(e) => setDraft((d) => ({ ...d, album: e.target.value }))} placeholder="可略過" className="rounded-xl bg-surface/50" /></div>
        <div className="space-y-1.5"><Label htmlFor="apple-music-url">Apple Music 連結</Label><Input id="apple-music-url" type="url" value={draft.appleMusicUrl} onChange={(e) => setDraft((d) => ({ ...d, appleMusicUrl: e.target.value }))} placeholder="https://music.apple.com/..." className="rounded-xl bg-surface/50" /></div>
        <div className="space-y-1.5"><Label htmlFor="spotify-url">Spotify 連結</Label><Input id="spotify-url" type="url" value={draft.spotifyUrl} onChange={(e) => setDraft((d) => ({ ...d, spotifyUrl: e.target.value }))} placeholder="https://open.spotify.com/..." className="rounded-xl bg-surface/50" /></div>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-3 pt-2"><button type="button" onClick={() => onOpenChange(false)} className="flex-1 rounded-full border border-border/70 py-3 text-sm">取消</button><button type="submit" disabled={saving} className="flex-1 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground shadow-soft disabled:opacity-60">{saving ? "儲存中…" : "加入歌曲"}</button></div>
      </form>
    </SheetContent>
  </Sheet>;
}
