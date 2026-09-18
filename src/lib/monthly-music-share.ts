import type { MonthlyMusicSummary } from "./monthly-music";
import {
  drawContainedImage,
  drawCoverImage,
  loadMusicRecapPhoto,
  type MusicRecapPhoto,
} from "./music-recap-photo";

const MONTHS = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

const CHINESE_MONTHS = [
  "一月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月",
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

function drawStat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: number,
  unit: string,
  label: string,
) {
  ctx.fillStyle = "rgba(255,255,255,0.76)";
  ctx.beginPath();
  ctx.roundRect(x, y, 390, 155, 38);
  ctx.fill();

  ctx.textAlign = "left";

  ctx.fillStyle = "#4e3e49";
  ctx.font = "700 56px 'Noto Sans TC', sans-serif";
  ctx.fillText(`${value}`, x + 34, y + 66);

  ctx.fillStyle = "#8d6f82";
  ctx.font = "600 34px 'Noto Sans TC', sans-serif";
  ctx.fillText(unit, x + 92, y + 64);

  ctx.fillStyle = "#8f7b87";
  ctx.font = "600 34px 'Noto Sans TC', sans-serif";
  ctx.fillText(label, x + 34, y + 112);

  ctx.textAlign = "center";
}

export async function shareMonthlyMusicCard(
  idolName: string,
  summary: MonthlyMusicSummary,
  photos?: MusicRecapPhoto,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("月度分享卡建立失敗");
  }

  const recapPhoto = await loadMusicRecapPhoto(photos);

  try {
    const monthName =
      MONTHS[summary.month - 1] ?? "MONTH";

    const chineseMonth =
      CHINESE_MONTHS[summary.month - 1] ?? `${summary.month}月`;

    const safeIdolName = idolName || "他";

    // Base diary gradient
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

    // Photo layer
    if (recapPhoto?.mode === "photo") {
      ctx.save();

      ctx.globalAlpha = 0.34;

      drawCoverImage(
        ctx,
        recapPhoto.image,
        0,
        0,
        1080,
        720,
      );

      ctx.restore();

      const fade = ctx.createLinearGradient(
        0,
        220,
        0,
        780,
      );

      fade.addColorStop(0, "rgba(255,250,246,0.08)");
      fade.addColorStop(0.6, "rgba(255,247,246,0.58)");
      fade.addColorStop(1, "#f8edf2");

      ctx.fillStyle = fade;
      ctx.fillRect(0, 180, 1080, 620);
    }

    // Soft decorations
    ctx.fillStyle = "rgba(255,255,255,0.48)";
    ctx.beginPath();
    ctx.arc(950, 190, 230, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.beginPath();
    ctx.arc(70, 1690, 300, 0, Math.PI * 2);
    ctx.fill();

    // Cutout photo
    if (recapPhoto?.mode === "cutout") {
      ctx.save();

      ctx.globalAlpha = 0.96;

      drawContainedImage(
        ctx,
        recapPhoto.image,
        560,
        105,
        500,
        650,
      );

      ctx.restore();

      const photoFade = ctx.createLinearGradient(
        0,
        450,
        0,
        790,
      );

      photoFade.addColorStop(0, "rgba(248,237,242,0)");
      photoFade.addColorStop(1, "#f8edf2");

      ctx.fillStyle = photoFade;
      ctx.fillRect(520, 430, 560, 370);
    }

    ctx.textAlign = "left";

    // Header
    ctx.fillStyle = "#9a7088";
    ctx.font = "600 36px 'Noto Sans TC', sans-serif";
    ctx.fillText(`${monthName} IN MUSIC ♡`, 90, 130);

    ctx.fillStyle = "#4e3e49";
    ctx.font = "700 58px 'Noto Sans TC', sans-serif";

    ctx.fillText(
      truncate(
        ctx,
        `我和 ${safeIdolName} 的${chineseMonth}`,
        recapPhoto?.mode === "cutout" ? 500 : 880,
      ),
      90,
      205,
    );

    ctx.fillStyle = "#927f8a";
    ctx.font = "500 34px 'Noto Sans TC', sans-serif";
    ctx.fillText(
      `${summary.year} · 這個月，我們留下了這些聲音`,
      90,
      255,
    );

    // Main memory number
    ctx.fillStyle = "#4e3e49";
    ctx.font = "700 112px 'Noto Sans TC', sans-serif";
    ctx.fillText(String(summary.memoryCount), 90, 440);

    ctx.fillStyle = "#9a7088";
    ctx.font = "600 36px 'Noto Sans TC', sans-serif";
    ctx.fillText("個音樂回憶", 90, 490);

    ctx.fillStyle = "#8f7c88";
    ctx.font = "500 34px 'Noto Sans TC', sans-serif";
    ctx.fillText("留在這個月 ♡", 90, 535);

    // Stats
    drawStat(
      ctx,
      110,
      765,
      summary.uniqueSongCount,
      "首",
      "留下的歌",
    );

    drawStat(
      ctx,
      580,
      765,
      summary.todaySongCount,
      "天",
      "今日歌曲",
    );

    drawStat(
      ctx,
      110,
      945,
      summary.comebackCount,
      "次",
      "回歸",
    );

    drawStat(
      ctx,
      580,
      945,
      summary.concertCount,
      "場",
      "演唱會",
    );

    // Song of the month
    if (summary.songOfTheMonth) {
      const remembered = summary.songOfTheMonth;

      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.roundRect(110, 1160, 860, 300, 50);
      ctx.fill();

      ctx.textAlign = "center";

      ctx.fillStyle = "#a2738e";
      ctx.font = "600 34px 'Noto Sans TC', sans-serif";
      centered(ctx, "SONG OF THE MONTH", 1225);

      ctx.fillStyle = "#9b8994";
      ctx.font = "500 30px 'Noto Sans TC', sans-serif";
      centered(
        ctx,
        "這個月最常出現在回憶裡的歌",
        1265,
      );

      ctx.fillStyle = "#4e3e49";
      ctx.font = "700 56px 'Noto Sans TC', sans-serif";

      centered(
        ctx,
        truncate(
          ctx,
          `♪ ${remembered.song.title}`,
          720,
        ),
        1340,
      );

      if (remembered.song.artist) {
        ctx.fillStyle = "#8d7987";
        ctx.font = "500 34px 'Noto Sans TC', sans-serif";

        centered(
          ctx,
          truncate(
            ctx,
            remembered.song.artist,
            700,
          ),
          1390,
        );
      }
    }

    // Closing
    ctx.textAlign = "center";
    ctx.fillStyle = "#695661";
    ctx.font = "600 42px 'Noto Sans TC', sans-serif";

    centered(
      ctx,
      `「${chineseMonth}的我們，`,
      1575,
    );

    centered(
      ctx,
      "後來都有歌可以記得。」",
      1625,
    );

    ctx.fillStyle = "#8d6680";
    ctx.font = "700 44px 'Noto Sans TC', sans-serif";
    centered(ctx, "IDOLDAYS ♡", 1770);

    ctx.fillStyle = "#a18d99";
    ctx.font = "500 30px 'Noto Sans TC', sans-serif";
    centered(
      ctx,
      "my idol, my days, my music",
      1815,
    );

    const blob = await new Promise<Blob | null>(
      (resolve) =>
        canvas.toBlob(resolve, "image/png"),
    );

    if (!blob) {
      throw new Error("月度分享卡建立失敗");
    }

    const file = new File(
      [blob],
      `idoldays-${summary.year}-${String(
        summary.month,
      ).padStart(2, "0")}-music.png`,
      { type: "image/png" },
    );

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: `${monthName} IN MUSIC ♡`,
        text: `我和 ${safeIdolName} 的 ${summary.year}年${summary.month}月音樂回憶 ♡`,
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
  } finally {
    recapPhoto?.cleanup();
  }
}
