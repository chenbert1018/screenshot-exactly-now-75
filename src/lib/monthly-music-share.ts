import type { MonthlyMusicSummary } from "./monthly-music";

const MONTHS = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL",
  "MAY", "JUNE", "JULY", "AUGUST",
  "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

function centered(
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

export async function shareMonthlyMusicCard(
  idolName: string,
  summary: MonthlyMusicSummary,
) {
  const canvas = document.createElement("canvas");

  canvas.width = 1080;
  canvas.height = 1920;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("月度分享卡建立失敗");
  }

  const monthName =
    MONTHS[summary.month - 1] ?? "MONTH";

  // Background
  const gradient = ctx.createLinearGradient(
    0,
    0,
    1080,
    1920,
  );

  gradient.addColorStop(0, "#fffaf6");
  gradient.addColorStop(0.48, "#f8edf2");
  gradient.addColorStop(1, "#ebe7f7");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  // Decorative circles
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.arc(920, 250, 270, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.arc(100, 1640, 330, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";

  // Header
  ctx.fillStyle = "#a2738e";
  ctx.font = "500 29px 'Noto Sans TC', sans-serif";

  centered(ctx, "MONTHLY MUSIC ♡", 155);

  ctx.fillStyle = "#4e3e49";
  ctx.font = "700 72px 'Noto Sans TC', sans-serif";

  centered(ctx, monthName, 275);

  ctx.font = "600 38px 'Noto Sans TC', sans-serif";

  centered(
    ctx,
    `WITH ${truncate(
      ctx,
      (idolName || "MY IDOL").toUpperCase(),
      650,
    )}`,
    340,
  );

  ctx.fillStyle = "#9a8592";
  ctx.font = "400 26px 'Noto Sans TC', sans-serif";

  centered(
    ctx,
    `${summary.year} · OUR MONTH IN MUSIC`,
    400,
  );

  // Main memory count
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.beginPath();
  ctx.roundRect(110, 500, 860, 300, 58);
  ctx.fill();

  ctx.fillStyle = "#4e3e49";
  ctx.font = "700 116px 'Noto Sans TC', sans-serif";

  centered(
    ctx,
    String(summary.memoryCount),
    655,
  );

  ctx.fillStyle = "#a2738e";
  ctx.font = "600 28px 'Noto Sans TC', sans-serif";

  centered(ctx, "MUSIC MEMORIES", 720);

  ctx.fillStyle = "#93808d";
  ctx.font = "400 24px 'Noto Sans TC', sans-serif";

  centered(
    ctx,
    "left in this month ♡",
    765,
  );

  // Stats
  const stats = [
    {
      value: summary.uniqueSongCount,
      label: "SONGS",
    },
    {
      value: summary.comebackCount,
      label: "COMEBACK",
    },
    {
      value: summary.concertCount,
      label: "CONCERT",
    },
  ];

  const width = 260;
  const gap = 24;
  const startX =
    (1080 - width * 3 - gap * 2) / 2;

  stats.forEach((stat, index) => {
    const x = startX + index * (width + gap);

    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.beginPath();

    ctx.roundRect(
      x,
      860,
      width,
      190,
      42,
    );

    ctx.fill();

    ctx.fillStyle = "#554451";
    ctx.font = "700 56px 'Noto Sans TC', sans-serif";

    ctx.fillText(
      String(stat.value),
      x + width / 2,
      942,
    );

    ctx.fillStyle = "#9b8292";
    ctx.font = "500 21px 'Noto Sans TC', sans-serif";

    ctx.fillText(
      stat.label,
      x + width / 2,
      995,
    );
  });

  // Song of the month
  if (summary.songOfTheMonth) {
    const remembered =
      summary.songOfTheMonth;

    ctx.fillStyle = "rgba(255,255,255,0.76)";
    ctx.beginPath();

    ctx.roundRect(
      110,
      1120,
      860,
      300,
      54,
    );

    ctx.fill();

    ctx.fillStyle = "#a2738e";
    ctx.font = "600 24px 'Noto Sans TC', sans-serif";

    centered(
      ctx,
      "SONG OF THE MONTH",
      1190,
    );

    ctx.fillStyle = "#4e3e49";
    ctx.font = "700 48px 'Noto Sans TC', sans-serif";

    centered(
      ctx,
      truncate(
        ctx,
        `♪ ${remembered.song.title}`,
        720,
      ),
      1270,
    );

    if (remembered.song.artist) {
      ctx.fillStyle = "#8d7987";
      ctx.font =
        "400 26px 'Noto Sans TC', sans-serif";

      centered(
        ctx,
        truncate(
          ctx,
          remembered.song.artist,
          700,
        ),
        1320,
      );
    }

    ctx.fillStyle = "#9b8292";
    ctx.font =
      "400 24px 'Noto Sans TC', sans-serif";

    centered(
      ctx,
      remembered.count > 1
        ? `${remembered.count} memories this month ♡`
        : "part of this month's story ♡",
      1375,
    );
  }

  // Closing
  ctx.fillStyle = "#6e5967";
  ctx.font =
    "500 31px 'Noto Sans TC', sans-serif";

  centered(
    ctx,
    `${monthName.charAt(0)}${monthName
      .slice(1)
      .toLowerCase()} sounded like this.`,
    1560,
  );

  ctx.fillStyle = "#8d6680";
  ctx.font =
    "700 38px 'Noto Sans TC', sans-serif";

  centered(ctx, "IdolDays ♡", 1745);

  ctx.fillStyle = "#a18d99";
  ctx.font =
    "400 22px 'Noto Sans TC', sans-serif";

  centered(
    ctx,
    "my idol, my days, my music",
    1790,
  );

  const blob = await new Promise<Blob | null>(
    (resolve) =>
      canvas.toBlob(
        resolve,
        "image/png",
      ),
  );

  if (!blob) {
    throw new Error("月度分享卡建立失敗");
  }

  const file = new File(
    [blob],
    `idoldays-${summary.year}-${String(
      summary.month,
    ).padStart(2, "0")}-music.png`,
    {
      type: "image/png",
    },
  );

  const title =
    `${monthName} WITH ${idolName} ♡`;

  if (
    navigator.canShare?.({
      files: [file],
    })
  ) {
    await navigator.share({
      title,
      text:
        `我和 ${idolName} 的 ${summary.year}年${summary.month}月音樂回憶 ♡`,
      files: [file],
    });

    return;
  }

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = file.name;
  link.click();

  setTimeout(
    () => URL.revokeObjectURL(url),
    1000,
  );
}
