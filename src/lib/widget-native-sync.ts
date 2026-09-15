import { useEffect } from "react";
import { resolveImageUrl } from "./storage";
import type { WidgetCompanionContent, WidgetContentType } from "./widget";
import { updateNativeWidget } from "./widget-native-bridge";

async function imageUrlToDataUrl(url: string): Promise<string> {
  if (!url) return "";
  if (url.startsWith("data:image/")) return url;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Widget image fetch failed: ${response.status}`);

  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error("Widget image conversion failed"));
    reader.readAsDataURL(blob);
  });
}

/**
 * 將目前的陪伴內容寫入 iOS App Group。
 * 掛在 root 後，偶像、重要日子或 Widget 偏好變更都會刷新 WidgetKit。
 */
export function useNativeWidgetSync({
  content,
  enabledContents,
  active,
}: {
  content: WidgetCompanionContent;
  enabledContents: WidgetContentType[];
  active: boolean;
}) {
  const idolName = content.idol?.name ?? "IdolDays";
  const idolImage = content.idol?.image ?? "";
  const eventTitle = content.importantDate?.title ?? "";
  const dDay = content.importantDate?.countdownLabel ?? "";
  const eventDate = content.importantDate?.date ?? "";
  const quote = content.dailyMessage;
  const moodEmoji = content.mood.emoji;
  const moodLabel = content.mood.label;
  const decorationEmoji = content.decoration.emoji ?? "";
  const decorationLabel = content.decoration.label;
  const enabledKey = enabledContents.join(",");

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    void (async () => {
      let imageData: string | undefined;
      if (idolImage) {
        try {
          imageData = await imageUrlToDataUrl(await resolveImageUrl(idolImage));
        } catch (error) {
          console.error("[IdolDays Widget] Photo sync failed:", error);
        }
      }

      if (cancelled) return;
      await updateNativeWidget({
        idolName,
        eventTitle,
        dDay,
        eventDate,
        location: "",
        quote,
        moodEmoji,
        moodLabel,
        decorationEmoji,
        decorationLabel,
        enabledContents,
        imageData,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [
    active,
    idolName,
    idolImage,
    eventTitle,
    dDay,
    eventDate,
    quote,
    moodEmoji,
    moodLabel,
    decorationEmoji,
    decorationLabel,
    enabledKey,
  ]);
}
