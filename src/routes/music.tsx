import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Music2, Plus, Share2, Trash2 } from "lucide-react";
import { AppShell, EmptyState, SoftCard } from "@/components/AppShell";
import { IdolSongFormSheet } from "@/components/IdolSongFormSheet";
import { MusicTimeline } from "@/components/MusicTimeline";
import { SONG_ROLE_OPTIONS, songRoleLabel, streamingLink, type SongRole } from "@/lib/idol-music";
import { useIdolMusicSource } from "@/lib/idol-music.source";
import { useIdolSource } from "@/lib/idols.source";
import { shareSoundtrackCard } from "@/lib/soundtrack-share";
import { useSongJournalHistory } from "@/lib/idol-song-journal.source";
import { useComebackDiaryHistory } from "@/lib/comeback-diary.source";
import { useConcertMusicMemoryHistory } from "@/lib/concert-music-memory.source";
import { buildMusicTimeline } from "@/lib/music-timeline";

export const Route = createFileRoute("/music")({ component: MusicPage });

function MusicPage() {
  const { homeIdol, ready: idolsReady } = useIdolSource();
  const { songs, roles, ready, error, addSong, setTodayPick, assignRole, removeSong } = useIdolMusicSource(homeIdol?.id);
  const songHistory = useSongJournalHistory(homeIdol?.id);
  const comebackHistory = useComebackDiaryHistory(homeIdol?.id);
  const concertHistory = useConcertMusicMemoryHistory(homeIdol?.id);

  const timelineItems = useMemo(
    () =>
      buildMusicTimeline({
        songs,
        journalEntries: songHistory.entries,
        comebackDiaries: comebackHistory.entries,
        concertMemories: concertHistory.entries,
      }),
    [
      songs,
      songHistory.entries,
      comebackHistory.entries,
      concertHistory.entries,
    ],
  );

  const timelineReady =
    songHistory.ready &&
    comebackHistory.ready &&
    concertHistory.ready;

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");
  const [sharing, setSharing] = useState(false);
  const today = songs.find((song) => song.isTodayPick);
  const roleSong = (role: SongRole) => songs.find((song) => song.id === roles.find((item) => item.role === role)?.songId);
  const run = async (key: string, action: () => Promise<void>) => { setBusy(key); setActionError(""); try { await action(); } catch { setActionError("沒有儲存成功，請確認網路後再試一次"); } finally { setBusy(""); } };
  const share = async () => {
    if (!homeIdol) return;
    setSharing(true); setActionError("");
    try { await shareSoundtrackCard(homeIdol.name || "MY IDOL", SONG_ROLE_OPTIONS.map(([role]) => ({ role, song: roleSong(role) }))); }
    catch { setActionError("分享卡建立失敗，請再試一次。"); }
    finally { setSharing(false); }
  };

  return <AppShell>
    <header className="mb-7"><p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">Our Songs</p><h1 className="mt-2 font-display text-[26px] font-medium">我們的歌 🎧</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">不是排行榜，是你和 {homeIdol?.name || "偶像"} 的音樂記憶。</p></header>
    {!idolsReady ? <div className="h-40 rounded-3xl bg-surface/50" /> : !homeIdol ? <EmptyState icon={<Music2 className="size-5" />} title="先選一位本命偶像" description="歌曲會和偶像、回憶一起保存。" action={<Link to="/idols" className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">前往偶像</Link>} /> : <>
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/15 to-accent/30 p-5 shadow-soft"><p className="text-xs tracking-[0.14em] text-primary">TODAY'S PICK</p><p className="mt-2 text-xl font-medium">{today?.title || "今天想聽哪一首？"}</p><p className="mt-1 text-sm text-muted-foreground">{today?.artist || "選一首歌，讓今天也有專屬 BGM。"}</p>{today && streamingLink(today) ? <a href={streamingLink(today)} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"><Music2 className="size-4" />合法串流播放 <ExternalLink className="size-3.5" /></a> : null}</section>
      <div className="mt-7 mb-3 flex items-center justify-between"><h2 className="font-display text-[15px] tracking-[0.08em]">我的音樂記憶</h2><button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground"><Plus className="size-3.5" />加入歌曲</button></div>
      {actionError || error ? <p role="alert" className="mb-3 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{actionError || "歌曲資料暫時讀取失敗，請稍後再試。"}</p> : null}
      {!ready ? <div className="h-36 rounded-3xl bg-surface/50" /> : songs.length === 0 ? <EmptyState icon={<Music2 className="size-5" />} title="還沒有第一首歌" description="把入坑曲、最愛或最近循環加進來。" action={<button onClick={() => setOpen(true)} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">加入第一首歌</button>} /> : <div className="space-y-3">{songs.map((song) => <SoftCard key={song.id} className="p-4"><div className="flex gap-3"><Music2 className="mt-0.5 size-5 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="truncate font-medium">{song.title}</p><p className="mt-1 truncate text-sm text-muted-foreground">{[song.artist, song.album].filter(Boolean).join(" · ") || "我的歌"}</p><div className="mt-3 flex flex-wrap gap-2"><button disabled={Boolean(busy)} onClick={() => void run(`today-${song.id}`, () => setTodayPick(song.id))} className={`rounded-full px-3 py-1.5 text-xs ${song.isTodayPick ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"}`}>{song.isTodayPick ? "今日播放中" : "設為今日歌曲"}</button>{streamingLink(song) ? <a href={streamingLink(song)} target="_blank" rel="noreferrer" className="rounded-full bg-surface px-3 py-1.5 text-xs text-muted-foreground">播放 ↗</a> : null}</div></div><button disabled={Boolean(busy)} aria-label={`刪除 ${song.title}`} onClick={() => void run(`delete-${song.id}`, () => removeSong(song.id))} className="p-1 text-muted-foreground"><Trash2 className="size-4" /></button></div></SoftCard>)}</div>}
      <MusicTimeline
        items={timelineItems}
        ready={timelineReady}
      />

      {songs.length > 0 ? <section className="mt-7"><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-[15px] tracking-[0.08em]">六首只屬於我們的歌</h2><button disabled={sharing} onClick={() => void share()} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"><Share2 className="size-3.5" />{sharing ? "建立中…" : "分享卡"}</button></div><div className="space-y-2">{SONG_ROLE_OPTIONS.map(([role, label]) => { const song = roleSong(role); return <div key={role} className="rounded-2xl bg-surface/60 px-4 py-3"><label className="block text-xs text-muted-foreground">{label}</label><select value={song?.id || ""} disabled={Boolean(busy)} onChange={(e) => e.target.value && void run(`role-${role}`, () => assignRole(role, e.target.value))} className="mt-1 w-full bg-transparent text-sm outline-none"><option value="">選一首歌</option>{songs.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>{song ? <p className="mt-1 text-xs text-primary">♡ {song.title}</p> : null}</div>; })}</div><p className="mt-3 text-xs leading-5 text-muted-foreground">分享卡只使用你建立的文字與 IdolDays 配色，不含偶像官方照片或音樂封面。</p></section> : null}
    </>}
    <IdolSongFormSheet open={open} onOpenChange={setOpen} onSubmit={addSong} />
  </AppShell>;
}
