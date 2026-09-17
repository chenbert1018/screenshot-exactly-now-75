import { Capacitor, registerPlugin } from "@capacitor/core";

export type WidgetTheme =
  | "system"
  | "light"
  | "dark"
  | "sky";

interface IdolDaysWidgetBridgePlugin {
  updateWidget(options: WidgetNativePayload): Promise<{
    success: boolean;
    snapshotPath?: string | undefined;
  }>;

  setTheme(options: {
    theme: WidgetTheme;
  }): Promise<{
    success: boolean;
  }>;
}

export interface WidgetNativePayload {
  theme: WidgetTheme;
  idolName: string;
  eventTitle: string;
  dDay: string;
  eventDate: string;
  location: string;
  quote: string;
  moodEmoji: string;
  moodLabel: string;
  decorationEmoji: string;
  decorationLabel: string;
  songTitle: string;
  songArtist: string;
  enabledContents: string[];
  imageData?: string | undefined;
}

const WidgetBridge =
  registerPlugin<IdolDaysWidgetBridgePlugin>(
    "IdolDaysWidgetBridge",
  );

export function isNativeWidgetAvailable(): boolean {
  return (
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "ios"
  );
}

export async function updateNativeWidget(
  payload: WidgetNativePayload,
): Promise<boolean> {
  if (!isNativeWidgetAvailable()) {
    return false;
  }

  try {
    const result = await WidgetBridge.updateWidget(payload);
    return result.success === true;
  } catch (error) {
    console.error(
      "[IdolDays Widget] Native sync failed:",
      error,
    );
    return false;
  }
}

export async function setNativeWidgetTheme(
  theme: WidgetTheme,
): Promise<boolean> {
  if (!isNativeWidgetAvailable()) {
    return false;
  }

  try {
    const result = await WidgetBridge.setTheme({ theme });
    return result.success === true;
  } catch (error) {
    console.error(
      "[IdolDays Widget] Native theme sync failed:",
      error,
    );
    return false;
  }
}
