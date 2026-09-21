type TodaySongShare = {
  title: string;
  artist?: string;
  mood?: string | null;
  idolName?: string;
};

type EraSongLine = { label: string; title: string };
type EraShare = { eraTitle: string; rating?: number | null; songs: EraSongLine[]; note?: string };

const INK = "#342c40";
const MUTED = "#85768f";
const ACCENT = "#8b729e";
const PAPER = "rgba(255,255,255,0.82)";

function dateStamp() {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" })
    .format(new Date()).toUpperCase().replace(",", " ·");
}

function base(label: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("分享卡建立失敗");
  const g = ctx.createLinearGradient(0, 0, 1080, 1920);
  g.addColorStop(0, "#fff9fb"); g.addColorStop(.52, "#f7f0fa"); g.addColorStop(1, "#eef1ff");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = "rgba(255,255,255,.48)";
  ctx.beginPath(); ctx.arc(930, 160, 255, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(35, 1700, 250, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = ACCENT; ctx.font = "600 31px 'Noto Sans TC', sans-serif"; ctx.fillText(label, 82, 120);
  ctx.fillStyle = MUTED; ctx.font = "500 23px 'Noto Sans TC', sans-serif"; ctx.fillText(dateStamp(), 82, 165);
  ctx.textAlign = "right"; ctx.fillText("IDOLDAYS · MUSIC DIARY", 998, 120); ctx.textAlign = "left";
  return { canvas, ctx };
}

function vinyl(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.fillStyle = "#e7deed"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(89,69,102,.12)"; ctx.lineWidth = 2;
  [0.78, .61, .44].forEach(v => { ctx.beginPath(); ctx.arc(x, y, r * v, 0, Math.PI * 2); ctx.stroke(); });
  ctx.fillStyle = "#fff9fc"; ctx.beginPath(); ctx.arc(x, y, r * .24, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#9c83ac"; ctx.beginPath(); ctx.arc(x, y, r * .055, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.arc(x - r * .3, y - r * .3, r * .11, 0, Math.PI * 2); ctx.fill();
}

function footer(ctx: CanvasRenderingContext2D, copy: string) {
  ctx.fillStyle = ACCENT; ctx.font = "600 37px 'Noto Sans TC', sans-serif"; ctx.fillText("IdolDays ♡", 82, 1762);
  ctx.fillStyle = MUTED; ctx.font = "400 25px 'Noto Sans TC', sans-serif"; ctx.fillText(copy, 82, 1810);
  ctx.textAlign = "right"; ctx.fillText("♪  ♡  ✦", 995, 1808); ctx.textAlign = "left";
}

function row(ctx: CanvasRenderingContext2D, label: string, value: string, y: number) {
  ctx.fillStyle = PAPER; ctx.beginPath(); ctx.roundRect(78, y, 924, 142, 34); ctx.fill();
  ctx.fillStyle = MUTED; ctx.font = "500 23px 'Noto Sans TC', sans-serif"; ctx.fillText(label.toUpperCase(), 116, y + 43);
  ctx.fillStyle = INK; ctx.font = "650 37px 'Noto Sans TC', sans-serif"; ctx.fillText(value.slice(0, 32), 116, y + 96);
}

async function nativeShare(canvas: HTMLCanvasElement, fileName: string, title: string, text: string) {
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("分享卡建立失敗");
  const file = new File([blob], fileName, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) return navigator.share({ title, text, files: [file] });
  if (navigator.share) return navigator.share({ title, text });
  await navigator.clipboard.writeText(text);
}

export async function shareTodaySongCard(input: TodaySongShare) {
  const { canvas, ctx } = base("TODAY'S SONG ♡");
  ctx.fillStyle = INK; ctx.font = "700 67px 'Noto Sans TC', sans-serif"; ctx.fillText("今天，和你一起聽", 82, 285);
  ctx.fillStyle = MUTED; ctx.font = "400 29px 'Noto Sans TC', sans-serif";
  ctx.fillText(input.idolName ? `with ${input.idolName}` : "MY MUSIC DIARY", 84, 337);

  ctx.save(); ctx.translate(0, 10); vinyl(ctx, 790, 620, 202); ctx.restore();
  ctx.fillStyle = PAPER; ctx.beginPath(); ctx.roundRect(72, 445, 670, input.mood ? 510 : 430, 48); ctx.fill();
  ctx.fillStyle = ACCENT; ctx.font = "600 24px 'Noto Sans TC', sans-serif"; ctx.fillText("NOW PLAYING", 116, 510);
  ctx.fillStyle = INK; ctx.font = "700 55px 'Noto Sans TC', sans-serif"; ctx.fillText(input.title.slice(0, 22), 116, 615);
  if (input.artist) { ctx.fillStyle = MUTED; ctx.font = "400 30px 'Noto Sans TC', sans-serif"; ctx.fillText(input.artist.slice(0, 28), 116, 670); }
  ctx.strokeStyle = "rgba(139,114,158,.28)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(116, 735); ctx.lineTo(620, 735); ctx.stroke();
  ctx.fillStyle = MUTED; ctx.font = "400 24px 'Noto Sans TC', sans-serif"; ctx.fillText("♪  play this moment again", 116, 790);
  if (input.mood) {
    ctx.fillStyle = "rgba(139,114,158,.12)"; ctx.beginPath(); ctx.roundRect(112, 825, 360, 74, 37); ctx.fill();
    ctx.fillStyle = ACCENT; ctx.font = "500 29px 'Noto Sans TC', sans-serif"; ctx.fillText(`TODAY'S MOOD   ${input.mood}`, 142, 873);
  }

  ctx.fillStyle = "rgba(139,114,158,.72)"; ctx.font = "500 25px 'Noto Sans TC', sans-serif";
  ctx.fillText("MY LITTLE LISTENING NOTE", 82, 1110);
  ctx.fillStyle = "rgba(255,255,255,.52)"; ctx.beginPath(); ctx.roundRect(72, 1145, 936, 280, 44); ctx.fill();
  ctx.fillStyle = MUTED; ctx.font = "400 28px 'Noto Sans TC', sans-serif";
  ctx.fillText("有些日子不用寫很多，", 116, 1235); ctx.fillText("記住今天聽了哪一首歌就好。", 116, 1290);
  ctx.fillStyle = "rgba(139,114,158,.35)"; ctx.font = "500 46px serif"; ctx.fillText("♡    ♪    ✦", 116, 1370);
  footer(ctx, "同一首歌，也會留下只屬於我的今天。");

  const text = ["TODAY'S SONG ♡", `♪ ${input.title}`, input.artist || "", input.mood ? `今天的心情：${input.mood}` : "", "", "from IdolDays ♡"].filter(Boolean).join("\n");
  await nativeShare(canvas, `idoldays-todays-song-${Date.now()}.png`, "TODAY'S SONG ♡", text);
}

export async function shareComebackEraCard(input: EraShare) {
  const { canvas, ctx } = base("COMEBACK DIARY ♡");
  ctx.fillStyle = INK; ctx.font = "700 63px 'Noto Sans TC', sans-serif"; ctx.fillText(`${input.eraTitle.slice(0, 20)} ERA`, 82, 285);
  ctx.fillStyle = MUTED; ctx.font = "400 27px 'Noto Sans TC', sans-serif"; ctx.fillText("MY ERA MEMORY · keep this comeback close", 84, 337);

  let y = 430;
  if (input.rating) { row(ctx, "first listen", "♥".repeat(input.rating) + "♡".repeat(Math.max(0, 5 - input.rating)), y); y += 166; }
  for (const song of input.songs.slice(0, 3)) { row(ctx, song.label, `♪ ${song.title}`, y); y += 166; }

  if (input.note) {
    ctx.fillStyle = "rgba(255,255,255,.58)"; ctx.beginPath(); ctx.roundRect(78, y + 12, 924, 190, 38); ctx.fill();
    ctx.fillStyle = MUTED; ctx.font = "500 22px 'Noto Sans TC', sans-serif"; ctx.fillText("ONE LINE FOR THIS ERA", 116, y + 60);
    ctx.fillStyle = INK; ctx.font = "400 31px 'Noto Sans TC', sans-serif"; ctx.fillText(`“ ${input.note.slice(0, 36)} ”`, 116, y + 125);
  } else {
    ctx.fillStyle = "rgba(139,114,158,.35)"; ctx.font = "500 46px serif"; ctx.fillText("♡     ♪     ✦     ♡", 116, Math.min(y + 150, 1450));
  }
  footer(ctx, "分享 Era，感受仍然只屬於每一個人。");

  const text = ["COMEBACK DIARY ♡", `${input.eraTitle} ERA ✨`, input.rating ? `第一次聽：${"💗".repeat(input.rating)}` : "", ...input.songs.map(song => `${song.label}：♪ ${song.title}`), input.note ? `「${input.note}」` : "", "", "from IdolDays ♡"].filter(Boolean).join("\n");
  await nativeShare(canvas, `idoldays-comeback-era-${Date.now()}.png`, `${input.eraTitle} · COMEBACK DIARY ♡`, text);
}
