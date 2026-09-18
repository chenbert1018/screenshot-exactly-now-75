import type { YearInMusicSummary } from "./year-in-music";
import {
  drawContainedImage,
  drawCoverImage,
  loadMusicRecapPhoto,
  type MusicRecapPhoto,
} from "./music-recap-photo";

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

  ctx.fillStyle = "#4c3d4a";
  ctx.font = "700 56px 'Noto Sans TC', sans-serif";
  ctx.fillText(String(value), x + 34, y + 66);

  ctx.fillStyle = "#8d6f82";
  ctx.font = "600 34px 'Noto Sans TC', sans-serif";
  ctx.fillText(unit, x + 92, y + 64);

  ctx.fillStyle = "#8f7b87";
  ctx.font = "600 34px 'Noto Sans TC', sans-serif";
  ctx.fillText(label, x + 34, y + 112);

  ctx.textAlign = "center";
}

export async function shareYearInMusicCard(
  idolName: string,
  summary: YearInMusicSummary,
  photos?: MusicRecapPhoto,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("年度分享卡建立失敗");
  }

  const recapPhoto = await loadMusicRecapPhoto(photos);

  try {
    const safeIdolName = idolName || "他";

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
        800,
      );

      fade.addColorStop(0, "rgba(255,248,244,0.08)");
      fade.addColorStop(0.6, "rgba(255,245,247,0.58)");
      fade.addColorStop(1, "#f7edf4");

      ctx.fillStyle = fade;
      ctx.fillRect(0, 180, 1080, 640);
    }

    ctx.fillStyle = "rgba(255,255,255,0.48)";
    ctx.beginPath();
    ctx.arc(950, 190, 230, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.beginPath();
    ctx.arc(70, 1690, 300, 0, Math.PI * 2);
    ctx.fill();

    if (recapPhoto?.mode === "cutout") {
      ctx.save();
      ctx.globalAlpha = 0.96;

      drawContainedImage(
        ctx,
        recapPhoto.image,
        560,
        100,
        500,
        660,
      );

      ctx.restore();

      const photoFade = ctx.createLinearGradient(
        0,
        450,
        0,
        810,
      );

      photoFade.addColorStop(0, "rgba(247,237,244,0)");
      photoFade.addColorStop(1, "#f7edf4");

      ctx.fillStyle = photoFade;
      ctx.fillRect(520, 440, 560, 380);
    }

    ctx.textAlign = "left";

    ctx.fillStyle = "#9b6f88";
    ctx.font = "600 36px 'Noto Sans TC', sans-serif";
    ctx.fillText(
      `${summary.year} YEAR IN MUSIC ♡`,
      90,
      130,
    );

    ctx.fillStyle = "#4c3d4a";
    ctx.font = "700 58px 'Noto Sans TC', sans-serif";

    ctx.fillText(
      truncate(
        ctx,
        `我和 ${safeIdolName} 的這一年`,
        recapPhoto?.mode === "cutout" ? 500 : 880,
      ),
      90,
      205,
    );

    ctx.fillStyle = "#927f8a";
    ctx.font = "500 34px 'Noto Sans TC', sans-serif";
    ctx.fillText(
      "原來這一年，也被好多首歌記住了。",
      90,
      255,
    );

    ctx.fillStyle = "#4c3d4a";
    ctx.font = "700 112px 'Noto Sans TC', sans-serif";
    ctx.fillText(
      String(summary.memoryCount),
      90,
      440,
    );

    ctx.fillStyle = "#9b6f88";
    ctx.font = "600 36px 'Noto Sans TC', sans-serif";
    ctx.fillText("個音樂回憶", 90, 490);

    ctx.fillStyle = "#8b7885";
    ctx.font = "500 34px 'Noto Sans TC', sans-serif";
    ctx.fillText(
      `留在 ${summary.year} ♡`,
      90,
      535,
    );

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

    if (summary.mostRememberedSong) {
      const remembered =
        summary.mostRememberedSong;

      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.roundRect(110, 1160, 860, 300, 50);
      ctx.fill();

      ctx.textAlign = "center";

      ctx.fillStyle = "#a4758f";
      ctx.font = "600 34px 'Noto Sans TC', sans-serif";
      centered(
        ctx,
        "MOST REMEMBERED SONG",
        1225,
      );

      ctx.fillStyle = "#9b8994";
      ctx.font = "500 30px 'Noto Sans TC', sans-serif";
      centered(
        ctx,
        "今年最常出現在回憶裡的歌",
        1265,
      );

      ctx.fillStyle = "#4c3d4a";
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

    ctx.textAlign = "center";

    ctx.fillStyle = "#695661";
    ctx.font = "600 42px 'Noto Sans TC', sans-serif";

    centered(
      ctx,
      `「${summary.year}，原來我用這些歌`,
      1575,
    );

    centered(
      ctx,
      "喜歡著你。」",
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
      throw new Error("年度分享卡建立失敗");
    }

    const file = new File(
      [blob],
      `idoldays-${summary.year}-our-music.png`,
      { type: "image/png" },
    );

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: `${summary.year} YEAR IN MUSIC ♡`,
        text: `我和 ${safeIdolName} 的 ${summary.year} 音樂回憶 ♡`,
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
