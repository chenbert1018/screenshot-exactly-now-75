import type { IdolSong, SongRole } from "./idol-music";
import { songRoleLabel } from "./idol-music";

type ShareLine = { role: SongRole; song?: IdolSong | undefined };

function drawWrapped(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split("");
  let line = "";
  let cursor = y;
  for (const word of words) {
    const next = line + word;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, cursor);
      cursor += lineHeight;
      line = word;
    } else line = next;
  }
  if (line) ctx.fillText(line, x, cursor);
  return cursor;
}

/** Generates a text-only 9:16 share image. No idol photo or music artwork is copied. */
export async function shareSoundtrackCard(idolName: string, lines: ShareLine[]) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("分享卡建立失敗");

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, "#eef5ff");
  gradient.addColorStop(0.5, "#dfe8ff");
  gradient.addColorStop(1, "#bdb5f1");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.beginPath(); ctx.arc(900, 300, 270, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(120, 1560, 310, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = "#314e88";
  ctx.font = "500 38px 'Noto Sans TC', sans-serif";
  ctx.fillText("MY IDOL SOUNDTRACK", 96, 176);
  ctx.font = "700 84px 'Noto Sans TC', sans-serif";
  drawWrapped(ctx, idolName.toUpperCase(), 96, 280, 850, 102);
  ctx.fillStyle = "#7189be";
  ctx.font = "400 34px 'Noto Sans TC', sans-serif";
  ctx.fillText("不是排行榜，是我喜歡你的方式。", 96, 390);

  let y = 520;
  for (const { role, song } of lines) {
    if (!song) continue;
    ctx.fillStyle = "rgba(255,255,255,0.74)";
    ctx.beginPath(); ctx.roundRect(78, y - 54, 924, 158, 42); ctx.fill();
    ctx.fillStyle = "#5d73aa";
    ctx.font = "500 30px 'Noto Sans TC', sans-serif";
    ctx.fillText(`♡ ${songRoleLabel(role)}`, 120, y);
    ctx.fillStyle = "#243866";
    ctx.font = "700 46px 'Noto Sans TC', sans-serif";
    ctx.fillText(song.title, 120, y + 58);
    if (song.artist) {
      ctx.fillStyle = "#64749b";
      ctx.font = "400 28px 'Noto Sans TC', sans-serif";
      ctx.fillText(song.artist, 120, y + 98);
    }
    y += 190;
  }
  ctx.fillStyle = "#425f9b";
  ctx.font = "600 42px 'Noto Sans TC', sans-serif";
  ctx.fillText("IdolDays", 96, 1770);
  ctx.font = "400 26px 'Noto Sans TC', sans-serif";
  ctx.fillText("每一首歌，都有只屬於你的理由 ♡", 96, 1820);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("分享卡建立失敗");
  const file = new File([blob], `my-idol-soundtrack-${Date.now()}.png`, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: `MY ${idolName} SOUNDTRACK`, text: "不是排行榜，是我喜歡你的方式。", files: [file] });
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = file.name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
