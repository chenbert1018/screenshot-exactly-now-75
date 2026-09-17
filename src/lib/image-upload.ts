const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const MAX_EDGE = 1600;

export class ImageUploadError extends Error {}

/**
 * Validates and right-sizes a user-selected image before it is kept in a
 * draft. This keeps iPhone photos from exhausting WebView/local storage and
 * makes the subsequent cloud upload materially more reliable.
 */
export async function prepareUserImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new ImageUploadError("請選擇圖片檔案");
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImageUploadError("照片超過 25MB，請先換一張較小的照片");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new ImageUploadError("無法讀取這張照片，請換一張再試"));
      element.src = objectUrl;
    });

    if (!image.naturalWidth || !image.naturalHeight) {
      throw new ImageUploadError("無法讀取這張照片，請換一張再試");
    }

    const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new ImageUploadError("目前無法處理這張照片，請再試一次");
    }

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.84);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
