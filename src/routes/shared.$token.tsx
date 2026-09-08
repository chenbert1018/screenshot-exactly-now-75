import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Images } from "lucide-react";
import { SoftCard } from "@/components/AppShell";
import { parseLocalDate } from "@/lib/dates";
import { loadPublicSharedAlbum, type PublicSharedAlbum } from "@/lib/shared-album";

export const Route = createFileRoute("/shared/$token")({
  head: () => ({ meta: [{ title: "分享的回憶相簿｜IdolDays" }, { name: "robots", content: "noindex" }] }),
  component: SharedAlbumPage,
});

function displayDate(value: string | null) {
  const date = parseLocalDate(value ?? "");
  if (!date) return "未標記日期";
  return `${date.y}.${String(date.m).padStart(2, "0")}.${String(date.d).padStart(2, "0")}`;
}

function SharedAlbumPage() {
  const { token } = Route.useParams();
  const [album, setAlbum] = useState<PublicSharedAlbum | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    void loadPublicSharedAlbum(token).then((data) => { if (active) setAlbum(data); });
    return () => { active = false; };
  }, [token]);

  if (album === undefined) {
    return <main className="mx-auto min-h-screen max-w-2xl px-5 py-12 text-center text-sm text-muted-foreground">正在開啟分享相簿…</main>;
  }
  if (!album) {
    return <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-5 text-center"><div><p className="font-display text-2xl">這個分享連結已失效。</p><p className="mt-3 text-sm text-muted-foreground">請向分享者索取新的連結。</p></div></main>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-10">
      <header className="mb-8">
        {album.folder.coverPhoto ? <img src={album.folder.coverPhoto} alt={album.folder.title} className="mb-5 aspect-[16/9] w-full rounded-3xl object-cover shadow-soft" /> : null}
        <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">Shared memories</p>
        <h1 className="mt-2 font-display text-[28px] font-medium">{album.folder.title}</h1>
      </header>
      {album.memories.length === 0 ? <p className="rounded-3xl bg-surface px-5 py-8 text-center text-sm text-muted-foreground">這本相簿還沒有回憶。</p> : <div className="space-y-5">
        {album.memories.map((memory) => <SoftCard key={memory.id} className="overflow-hidden p-0">
          {memory.photo ? <img src={memory.photo} alt={memory.title} className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[16/7] items-center justify-center bg-accent/20 text-primary/40"><Images className="size-6" /></div>}
          <div className="px-5 py-4"><p className="text-xs tracking-[0.14em] text-muted-foreground">{displayDate(memory.date)}</p><p className="mt-1 text-[16px] font-medium">{memory.title || "未命名的回憶"}</p>{memory.note ? <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{memory.note}</p> : null}</div>
        </SoftCard>)}
      </div>}
    </main>
  );
}
