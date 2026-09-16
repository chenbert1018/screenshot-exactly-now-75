import { StoredImage } from "@/components/StoredImage";
import { PhotoCropPositionControl, PhotoCropPreview } from "@/components/PhotoCropControls";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Sparkles, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emptyDraft, REPRESENTATIVE_ANIMALS, type IdolDraft } from "@/lib/idols";
import { saveCutoutImage } from "@/lib/cutout-image-store";
import { resolveImageUrl } from "@/lib/storage";
import {
  createNativeSubjectCutout,
  isNativeSubjectCutoutAvailable,
} from "@/lib/subject-cutout-native";

const fields: { key: keyof IdolDraft; label: string; type?: string }[] = [
  { key: "name", label: "偶像名稱" },
  { key: "groupName", label: "團體名稱" },
  { key: "birthday", label: "生日", type: "date" },
  { key: "debutDate", label: "出道日期", type: "date" },
  { key: "fanName", label: "粉絲名稱" },
  { key: "sinceDate", label: "我喜歡他的日期", type: "date" },
];


async function imageSourceToDataUrl(source: string): Promise<string> {
  if (source.startsWith("data:image/")) {
    return source;
  }

  const resolved = await resolveImageUrl(source);

  if (!resolved) {
    throw new Error("Unable to resolve image");
  }

  const response = await fetch(resolved);

  if (!response.ok) {
    throw new Error("Unable to download image");
  }

  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result ?? "");

      if (!result.startsWith("data:image/")) {
        reject(new Error("Invalid image data"));
        return;
      }

      resolve(result);
    };

    reader.onerror = () =>
      reject(reader.error ?? new Error("Unable to read image"));

    reader.readAsDataURL(blob);
  });
}

export function IdolFormSheet({
  open,
  onOpenChange,
  initial,
  title,
  submitLabel,
  onSubmit,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: IdolDraft;
  title: string;
  submitLabel: string;
  onSubmit: (draft: IdolDraft) => void;
  footer?: React.ReactNode;
}) {
  const [draft, setDraft] = useState<IdolDraft>({ ...emptyDraft, ...initial });
  const [error, setError] = useState("");
  const [cutoutBusy, setCutoutBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setDraft({ ...emptyDraft, ...initial });
      setError("");
      setCutoutBusy(false);
    }
  }, [open, initial]);

  function pickPhoto(file?: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setDraft((d) => ({
        ...d,
        photo: String(reader.result ?? ""),
        cutoutPhoto: "",
        photoPosition: 50,
      }));
    reader.readAsDataURL(file);
  }

  async function createCutout() {
    if (!draft.photo || cutoutBusy) return;

    if (!isNativeSubjectCutoutAvailable()) {
      setError("人物去背目前需在 iPhone App 內使用");
      return;
    }

    setCutoutBusy(true);
    setError("");

    try {
      const nativeImageData =
      await imageSourceToDataUrl(draft.photo);

    const result =
      await createNativeSubjectCutout(nativeImageData);

      if (!result?.imageData) {
        setError("找不到清楚的人物主體，請換一張照片再試");
        return;
      }

      const cutoutRef = await saveCutoutImage(
      result.imageData,
      draft.cutoutPhoto,
    );

    setDraft((d) => ({
      ...d,
      cutoutPhoto: cutoutRef,
    }));
    } catch {
      setError("人物去背失敗，請換一張人物較清楚的照片再試");
    } finally {
      setCutoutBusy(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) {
      setError("請先幫這位偶像留下名字");
      return;
    }
    onSubmit({
      ...draft,
      name: draft.name.trim(),
      representativeAnimal: draft.representativeAnimal ?? "DOG",
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-border/60 bg-card px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="px-0 text-left">
          <SheetTitle className="text-xl">{title}</SheetTitle>
          <SheetDescription>只留下你想記得的部分就好</SheetDescription>
        </SheetHeader>

        <form onSubmit={submit} className="space-y-5 pt-2">
          <div>
            <p className="mb-2 text-sm font-medium">上傳偶像照片</p>
            {draft.photo ? (
              <>
              <div className="relative overflow-hidden rounded-2xl border border-border/60">
                {draft.cutoutPhoto ? (
                  <StoredImage
                    src={draft.cutoutPhoto}
                    alt="偶像照片預覽"
                    className="aspect-[3/4] w-full bg-gradient-to-b from-[#f8dce8] via-[#fae7ee] to-[#f7dfe7] object-contain"
                  />
                ) : (
                  <PhotoCropPreview src={draft.photo} alt="偶像照片預覽" position={draft.photoPosition} aspectClass="aspect-[3/4]" />
                )}
                <div className="absolute right-3 bottom-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="rounded-full bg-card/90 px-3 py-1.5 text-xs shadow-soft"
                  >
                    重新選擇
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        photo: "",
                        cutoutPhoto: "",
                      }))
                    }
                    className="rounded-full bg-card/90 p-1.5 shadow-soft"
                    aria-label="移除照片"
                  >
                    <X className="size-4" strokeWidth={1.8} />
                  </button>
                </div>

                {isNativeSubjectCutoutAvailable() ? (
                  <button
                    type="button"
                    onClick={createCutout}
                    disabled={cutoutBusy}
                    className="absolute left-3 bottom-3 flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1.5 text-xs shadow-soft disabled:opacity-60"
                  >
                    <Sparkles className="size-3.5" strokeWidth={1.7} />
                    {cutoutBusy
                      ? "人物去背中…"
                      : draft.cutoutPhoto
                        ? "重新去背"
                        : "人物去背"}
                  </button>
                ) : null}
                {!draft.cutoutPhoto ? (
                  <div className="absolute right-3 bottom-14 left-3">
                    <PhotoCropPositionControl
                      id="idol-photo-position"
                      value={draft.photoPosition}
                      onChange={(photoPosition) => setDraft((d) => ({ ...d, photoPosition }))}
                    />
                  </div>
                ) : null}
              </div>

              {draft.cutoutPhoto ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  已完成本機人物去背，原始照片仍會保留。
                </p>
              ) : null}
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/50 text-muted-foreground"
              >
                <ImagePlus className="size-6" strokeWidth={1.4} />
                <span className="text-sm">放一張你最喜歡的照片</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                pickPhoto(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>

          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={f.key}>
                {f.label}
                {f.key === "name" ? <span className="ml-1 text-primary">*</span> : null}
              </Label>
              <Input
                id={f.key}
                type={f.type ?? "text"}
                value={draft[f.key]}
                onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                className="rounded-xl bg-surface/50"
              />
            </div>
          ))}

          <div className="space-y-2">
            <Label>偶像代表動物</Label>
            <p className="text-xs leading-5 text-muted-foreground">
              用來決定首頁與追星天氣的專屬口吻。
            </p>
            <div className="grid grid-cols-3 gap-2">
              {REPRESENTATIVE_ANIMALS.map((animal) => {
                const active = (draft.representativeAnimal ?? "DOG") === animal.value;
                return (
                  <button
                    key={animal.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setDraft((d) => ({ ...d, representativeAnimal: animal.value }))}
                    className={`rounded-xl border px-2 py-2.5 text-xs transition-colors ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/70 bg-surface/50 text-muted-foreground"
                    }`}
                  >
                    <span className="mr-1">{animal.emoji}</span>{animal.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
          >
            {submitLabel}
          </button>
          {footer}
        </form>
      </SheetContent>
    </Sheet>
  );
}
