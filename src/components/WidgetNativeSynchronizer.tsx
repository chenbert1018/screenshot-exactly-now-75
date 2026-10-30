import { useEffect, useRef } from "react";
import { useEventSource } from "@/lib/events.source";
import { useIdolMusicSource } from "@/lib/idol-music.source";
import { useIdolSource } from "@/lib/idols.source";
import { resolveImageUrl } from "@/lib/storage";
import { useSettings } from "@/lib/settings";
import { getWidgetCompanionContent } from "@/lib/widget";
import { updateNativeWidget } from "@/lib/widget-native-bridge";
import { useWidgetPreferenceSource } from "@/lib/widget-preferences.source";
import { WIDGET_SYNC_EVENT } from "@/lib/widget-sync-event";

async function imageUrlToDataUrl(url: string): Promise<string> {
  if (!url) return "";
  if (url.startsWith("data:image/")) return url;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Widget image fetch failed: ${response.status}`);
  }

  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () =>
      reject(reader.error ?? new Error("Widget image conversion failed"));
    reader.readAsDataURL(blob);
  });
}

export function WidgetNativeSynchronizer() {
  const { settings } = useSettings();
  const syncVersion = useRef(0);
  const idolSource = useIdolSource();
  const eventSource = useEventSource();
  const preferenceSource = useWidgetPreferenceSource();

  const selectedId =
    preferenceSource.prefs?.idolId ?? idolSource.idols[0]?.id;
  const musicSource = useIdolMusicSource(selectedId);

  useEffect(() => {
    const refresh = () => {
      idolSource.reload();
      eventSource.reload();
      preferenceSource.reload();
      musicSource.reload();
    };

    window.addEventListener(WIDGET_SYNC_EVENT, refresh);
    return () => window.removeEventListener(WIDGET_SYNC_EVENT, refresh);
  }, [
    idolSource.reload,
    eventSource.reload,
    preferenceSource.reload,
    musicSource.reload,
  ]);

  useEffect(() => {
    if (
      !idolSource.ready ||
      !eventSource.ready ||
      !preferenceSource.ready ||
      !preferenceSource.prefs ||
      !musicSource.ready
    ) {
      return;
    }

    const content = getWidgetCompanionContent({
      idols: idolSource.idols,
      events: eventSource.events,
      songs: musicSource.songs,
      preferences: preferenceSource.prefs,
    });

    const version = ++syncVersion.current;
    void (async () => {
      const idolName = content.idol?.name ?? "";
      const idolImage = content.idol?.image ?? "";
      // Never keep the previous idol photo if the new image cannot be loaded.
      let imageData = "";

      if (idolImage) {
        try {
          const resolved = await resolveImageUrl(idolImage);
          const converted = await imageUrlToDataUrl(resolved);
          if (converted) imageData = converted;
        } catch (error) {
          console.error("[IdolDays Widget] Photo sync failed:", error);
        }
      }

      // A slow photo download must not overwrite a newer idol/event selection.
      if (version !== syncVersion.current) return;
      await updateNativeWidget({
        idolName,
        eventTitle: content.importantDate?.title ?? "",
        dDay: content.importantDate?.countdownLabel ?? "",
        eventDate: content.importantDate?.date ?? "",
        location: "",
        quote: content.dailyMessage ?? "",
        moodEmoji: content.mood?.emoji ?? "",
        moodLabel: content.mood?.label ?? "",
        decorationEmoji: content.decoration?.emoji ?? "",
        decorationLabel: content.decoration?.label ?? "",
        songTitle: content.todaySong?.title ?? "",
        songArtist: content.todaySong?.artist ?? "",
        theme: settings.theme,
        enabledContents: preferenceSource.prefs.enabledContents,
        imageData,
      });
    })();
    return () => {
      syncVersion.current += 1;
    };
  }, [
    idolSource.ready,
    idolSource.idols,
    eventSource.ready,
    eventSource.events,
    preferenceSource.ready,
    preferenceSource.prefs,
    musicSource.ready,
    musicSource.songs,
    settings.theme,
  ]);

  return null;
}
