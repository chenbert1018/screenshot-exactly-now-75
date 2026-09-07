import { useImageSrc } from "@/lib/storage";

type StoredImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | null | undefined;
};

/**
 * 顯示照片用的共用 <img>。
 * 本機 dataURL 直接顯示；雲端 Storage 照片統一由 storage helper 換成 signed URL。
 * 只負責取得圖片來源，不改任何版面樣式。
 */
export function StoredImage({ src, ...props }: StoredImageProps) {
  const resolved = useImageSrc(src);
  return <img {...props} src={resolved} />;
}
