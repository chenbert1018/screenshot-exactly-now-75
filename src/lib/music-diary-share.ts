type TodaySongShare = {
  title: string;
  artist?: string;
  mood?: string | null;
  idolName?: string;
};

type EraSongLine = { label: string; title: string };

type EraShare = {
  eraTitle: string;
  rating?: number | null;
  songs: EraSongLine[];
  note?: string;
};

function cardBase(label: string, title: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("分享卡建立失敗");

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, "#fff8fb");
  gradient.addColorStop(0.48, "#f5efff");
  gradient.addColorStop(1, "#e8edff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  ctx.fillStyle = "rgba(255,255,255,0.58)";
  ctx.beginPath(); ctx.arc(910, 250, 270, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(80, 1640, 320, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = "#816b98";
  ctx.font = "600 32px 'Noto Sans TC', sans-serif";
  ctx.fillText(label, 90, 150);
  ctx.fillStyle = "#30283c";
  ctx.font = "700 72px 'Noto Sans TC', sans-serif";
  ctx.fillText(title, 90, 260);
  return { canvas, ctx };
}

function line(ctx: CanvasRenderingContext2D, label: string, value: string, y: number) {
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.beginPath(); ctx.roundRect(78, y - 62, 924, 156, 42); ctx.fill();
  ctx.fillStyle = "#8c7aa1";
  ctx.font = "500 27px 'Noto Sans TC', sans-serif";
  ctx.fillText(label, 120, y - 12);
  ctx.fillStyle = "#342d40";
  ctx.font = "650 42px 'Noto Sans TC', sans-serif";
  ctx.fillText(value.slice(0, 28), 120, y + 48);
}

async function nativeShare(canvas: HTMLCanvasElement, fileName: string, title: string, text: string) {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("分享卡建立失敗");
  const file = new File([blob], fileName, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title, text, files: [file] });
    return;
  }
  if (navigator.share) {
    await navigator.share({ title, text });
    return;
  }
  await navigator.clipboard.writeText(text);
}

export async function shareTodaySongCard(input: TodaySongShare) {
  const { canvas, ctx } = cardBase("TODAY'S SONG ♡", "今天，和你一起聽");
  ctx.fillStyle = "#79678e";
  ctx.font = "400 30px 'Noto Sans TC', sans-serif";
  ctx.fillText(input.idolName ? `with ${input.idolName}` : "MY MUSIC DIARY", 90, 320);

  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.beginPath(); ctx.roundRect(78, 450, 924, 560, 56); ctx.fill();
  ctx.fillStyle = "#9b89af";
  ctx.font = "500 28px 'Noto Sans TC', sans-serif";
  ctx.fillText("NOW PLAYING", 130, 550);
  ctx.fillStyle = "#30283c";
  ctx.font = "700 64px 'Noto Sans TC', sans-serif";
  ctx.fillText(input.title.slice(0, 24), 130, 670);
  if (input.artist) {
    ctx.fillStyle = "#756d80";
    ctx.font = "400 34px 'Noto Sans TC', sans-serif";
    ctx.fillText(input.artist.slice(0, 30), 130, 730);
  }
  if (input.mood) {
    ctx.fillStyle = "#816b98";
    ctx.font = "500 36px 'Noto Sans TC', sans-serif";
    ctx.fillText(`今天的心情  ${input.mood}`, 130, 880);
  }

  ctx.fillStyle = "#6d5b80";
  ctx.font = "600 40px 'Noto Sans TC', sans-serif";
  ctx.fillText("IdolDays", 90, 1760);
  ctx.font = "400 27px 'Noto Sans TC', sans-serif";
  ctx.fillText("同一首歌，也會留下只屬於我的今天 ♡", 90, 1810);

  const text = ["TODAY'S SONG ♡", `♪ ${input.title}`, input.artist || "", input.mood ? `今天的心情：${input.mood}` : "", "", "from IdolDays ♡"].filter(Boolean).join("\n");
  await nativeShare(canvas, `idoldays-todays-song-${Date.now()}.png`, "TODAY'S SONG ♡", text);
}

export async function shareComebackEraCard(input: EraShare) {
  const { canvas, ctx } = cardBase("COMEBACK DIARY ♡", `${input.eraTitle} ERA`);
  ctx.fillStyle = "#79678e";
  ctx.font = "400 30px 'Noto Sans TC', sans-serif";
  ctx.fillText("MY ERA MEMORY ✦", 90, 320);

  let y = 500;
  if (input.rating) {
    line(ctx, "第一次聽的感覺", "♥".repeat(input.rating) + "♡".repeat(Math.max(0, 5 - input.rating)), y);
    y += 190;
  }
  for (const song of input.songs.slice(0, 3)) {
    line(ctx, song.label, `♪ ${song.title}`, y);
    y += 190;
  }
  if (input.note) {
    ctx.fillStyle = "#5e526c";
    ctx.font = "400 32px 'Noto Sans TC', sans-serif";
    ctx.fillText(`“ ${input.note.slice(0, 38)} ”`, 100, Math.min(y + 40, 1500));
  }

  ctx.fillStyle = "#6d5b80";
  ctx.font = "600 40px 'Noto Sans TC', sans-serif";
  ctx.fillText("IdolDays", 90, 1760);
  ctx.font = "400 27px 'Noto Sans TC', sans-serif";
  ctx.fillText("分享 Era，感受仍然只屬於每一個人 ♡", 90, 1810);

  const text = ["COMEBACK DIARY ♡", `${input.eraTitle} ERA ✨`, input.rating ? `第一次聽：${"💗".repeat(input.rating)}` : "", ...input.songs.map((song) => `${song.label}：♪ ${song.title}`), input.note ? `「${input.note}」` : "", "", "from IdolDays ♡"].filter(Boolean).join("\n");
  await nativeShare(canvas, `idoldays-comeback-era-${Date.now()}.png`, `${input.eraTitle} · COMEBACK DIARY ♡`, text);
}
