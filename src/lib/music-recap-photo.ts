import {
  isCutoutImageRef,
  loadCutoutImageBlob,
} from "./cutout-image-store";
import {
  isStorageRef,
  resolveImageUrl,
} from "./storage";

export type MusicRecapPhoto = {
  photo?: string | undefined;
  cutoutPhoto?: string | undefined;
};

async function resolveImageSource(
  value?: string,
): Promise<{
  src: string;
  revoke?: () => void;
} | null> {
  if (!value) return null;

  if (isCutoutImageRef(value)) {
    const blob = await loadCutoutImageBlob(value);

    if (!blob) return null;

    const src = URL.createObjectURL(blob);

    return {
      src,
      revoke: () => URL.revokeObjectURL(src),
    };
  }

  if (isStorageRef(value)) {
    const src = await resolveImageUrl(value);

    return src ? { src } : null;
  }

  return { src: value };
}

function loadHtmlImage(src: string) {
  return new Promise<HTMLImageElement>(
    (resolve, reject) => {
      const image = new Image();

      if (
        src.startsWith("http://") ||
        src.startsWith("https://")
      ) {
        image.crossOrigin = "anonymous";
      }

      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(new Error("Unable to load recap photo"));

      image.src = src;
    },
  );
}

export async function loadMusicRecapPhoto(
  photos?: MusicRecapPhoto,
): Promise<{
  image: HTMLImageElement;
  mode: "cutout" | "photo";
  cleanup: () => void;
} | null> {
  const candidates = [
    {
      value: photos?.cutoutPhoto,
      mode: "cutout" as const,
    },
    {
      value: photos?.photo,
      mode: "photo" as const,
    },
  ];

  for (const candidate of candidates) {
    if (!candidate.value) continue;

    let resolved:
      | Awaited<ReturnType<typeof resolveImageSource>>
      | null = null;

    try {
      resolved = await resolveImageSource(
        candidate.value,
      );

      if (!resolved) continue;

      const image = await loadHtmlImage(resolved.src);

      return {
        image,
        mode: candidate.mode,
        cleanup: () => resolved?.revoke?.(),
      };
    } catch {
      resolved?.revoke?.();
    }
  }

  return null;
}

export function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(
    width / image.naturalWidth,
    height / image.naturalHeight,
  );

  const sourceWidth = width / scale;
  const sourceHeight = height / scale;

  const sourceX =
    (image.naturalWidth - sourceWidth) / 2;

  const sourceY =
    (image.naturalHeight - sourceHeight) / 2;

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
}

export function drawContainedImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.min(
    width / image.naturalWidth,
    height / image.naturalHeight,
  );

  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;

  ctx.drawImage(
    image,
    x + (width - drawWidth) / 2,
    y + height - drawHeight,
    drawWidth,
    drawHeight,
  );
}
