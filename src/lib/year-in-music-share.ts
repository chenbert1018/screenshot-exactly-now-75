import type { YearInMusicSummary } from "./year-in-music";

function drawCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
) {
  ctx.fillText(text, 540, y);
}

function truncate(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  if (ctx.measureText(text).width <= maxWidth) return text;

  let value = text;

  while (
    value.length > 1 &&
    ctx.measureText(`${value}…`).width > maxWidth
  ) {
    value = value.slice(0, -1);
  }

  return `${value}…`;
}

export async function shareYearInMusicCard(
  idolName: string,
  summary: YearInMusicSummary,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("年度分享卡建立失敗");

  // Soft IdolDays diary gradient
  const gradient = ctx.createLinearGradient(
    0,
    0,
    1080,
    1920,
  );

  gradient.addColorStop(0, "#fff8f4");
  gradient.addColorStop(0.48, "#f7edf4");
  gradient.addColorStop(1, "#e9e5f8");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  // Decorative soft circles
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.arc(910, 220, 250, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.arc(120, 1640, 320, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";

  // Header
  ctx.fillStyle = "#9b6f88";
  ctx.font = "500 30px 'Noto Sans TC', sans-serif";
  drawCentered(ctx, "YEAR IN MUSIC ♡", 150);

  ctx.fillStyle = "#4c3d4a";
  ctx.font = "700 92px 'Noto Sans TC', sans-serif";
  drawCentered(ctx, String(summary.year), 275);

  ctx.font = "600 44px 'Noto Sans TC', sans-serif";
  drawCentered(ctx, "OUR MUSIC", 340);

  ctx.fillStyle = "#9b8292";
  ctx.font = "400 27px 'Noto Sans TC', sans-serif";

  const safeIdolName = truncate(
    ctx,
    `${idolName.toUpperCase()} & ME`,
    820,
  );

  drawCentered(ctx, safeIdolName, 405);

  // Main Today's Song number
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.beginPath();
  ctx.roundRect(110, 500, 860, 290, 58);
  ctx.fill();

  ctx.fillStyle = "#4c3d4a";
  ctx.font = "700 112px 'Noto Sans TC', sans-serif";
  drawCentered(
    ctx,
    String(summary.todaySongCount),
    645,
  );

  ctx.fillStyle = "#9b6f88";
  ctx.font = "600 29px 'Noto Sans TC', sans-serif";
  drawCentered(ctx, "TODAY'S SONG", 710);

  ctx.fillStyle = "#8b7885";
  ctx.font = "400 25px 'Noto Sans TC', sans-serif";
  drawCentered(
    ctx,
    "songs that became part of my days",
    755,
  );

  // Stats
  const statY = 850;
  const statWidth = 260;
  const statHeight = 190;
  const gap = 24;
  const totalWidth = statWidth * 3 + gap * 2;
  const startX = (1080 - totalWidth) / 2;

  const stats = [
    {
      value: summary.uniqueSongCount,
      label: "SONGS",
    },
    {
      value: summary.comebackCount,
      label: "COMEBACKS",
    },
    {
      value: summary.concertCount,
      label: "CONCERTS",
    },
  ];

  stats.forEach((stat, index) => {
    const x = startX + index * (statWidth + gap);

    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.beginPath();
    ctx.roundRect(
      x,
      statY,
      statWidth,
      statHeight,
      42,
    );
    ctx.fill();

    ctx.fillStyle = "#554451";
    ctx.font = "700 56px 'Noto Sans TC', sans-serif";
    ctx.fillText(
      String(stat.value),
      x + statWidth / 2,
      statY + 82,
    );

    ctx.fillStyle = "#9b8292";
    ctx.font = "500 22px 'Noto Sans TC', sans-serif";
    ctx.fillText(
      stat.label,
      x + statWidth / 2,
      statY + 132,
    );
  });

  // Most remembered song
  if (summary.mostRememberedSong) {
    const remembered = summary.mostRememberedSong;

    ctx.fillStyle = "rgba(255,255,255,0.76)";
    ctx.beginPath();
    ctx.roundRect(110, 1110, 860, 300, 54);
    ctx.fill();

    ctx.fillStyle = "#a4758f";
    ctx.font = "600 24px 'Noto Sans TC', sans-serif";
    drawCentered(
      ctx,
      "MOST REMEMBERED SONG",
      1180,
    );

    ctx.fillStyle = "#4c3d4a";
    ctx.font = "700 48px 'Noto Sans TC', sans-serif";

    const songTitle = truncate(
      ctx,
      `♪ ${remembered.song.title}`,
      720,
    );

    drawCentered(ctx, songTitle, 1260);

    if (remembered.song.artist) {
      ctx.fillStyle = "#8d7987";
      ctx.font = "400 26px 'Noto Sans TC', sans-serif";

      drawCentered(
        ctx,
        truncate(
          ctx,
          remembered.song.artist,
          700,
        ),
        1310,
      );
    }

    ctx.fillStyle = "#9b8292";
    ctx.font = "400 25px 'Noto Sans TC', sans-serif";

    drawCentered(
      ctx,
      `${remembered.count} memories this year ♡`,
      1365,
    );
  }

  // Quote
  ctx.fillStyle = "#6d5966";
  ctx.font = "500 30px 'Noto Sans TC', sans-serif";

  drawCentered(
    ctx,
    "the days I loved you",
    1540,
  );

  drawCentered(
    ctx,
    "all had their own BGM.",
    1585,
  );

  // Branding
  ctx.fillStyle = "#8d6680";
  ctx.font = "700 38px 'Noto Sans TC', sans-serif";
  drawCentered(ctx, "IdolDays ♡", 1745);

  ctx.fillStyle = "#a18d99";
  ctx.font = "400 22px 'Noto Sans TC', sans-serif";
  drawCentered(
    ctx,
    "my idol, my days, my music",
    1790,
  );

  const blob = await new Promise<Blob | null>(
    (resolve) =>
      canvas.toBlob(resolve, "image/png"),
  );

  if (!blob) {
    throw new Error("年度分享卡建立失敗");
  }

  const file = new File(
    [blob],
    `idoldays-${summary.year}-our-music.png`,
    { type: "image/png" },
  );

  const title = `${summary.year} OUR MUSIC ♡`;

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title,
      text: `我和 ${idolName} 的 ${summary.year} 音樂回憶 ♡`,
      files: [file],
    });

    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = file.name;
  link.click();

  setTimeout(
    () => URL.revokeObjectURL(url),
    1000,
  );
}
