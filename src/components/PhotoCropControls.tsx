import { StoredImage } from "@/components/StoredImage";

export function PhotoCropPreview({
  src,
  alt,
  position,
  aspectClass,
}: {
  src: string;
  alt: string;
  position: number;
  aspectClass: string;
}) {
  return (
    <div className={`relative w-full overflow-hidden bg-surface ${aspectClass}`}>
      <StoredImage
        src={src}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full scale-110 object-cover opacity-35 blur-2xl"
      />
      <StoredImage
        src={src}
        alt={alt}
        className="relative size-full object-cover"
        style={{ objectPosition: `50% ${position}%` }}
      />
    </div>
  );
}

export function PhotoCropPositionControl({
  id,
  value,
  onChange,
}: {
  id: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl bg-card/90 px-3 py-2.5 shadow-soft backdrop-blur-sm">
      <label htmlFor={id} className="flex items-center justify-between text-xs font-medium">
        <span>調整照片構圖</span>
        <span className="text-muted-foreground">上下移動</span>
      </label>
      <input
        id={id}
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 block w-full accent-primary"
        aria-label="上下調整照片顯示範圍"
      />
    </div>
  );
}
