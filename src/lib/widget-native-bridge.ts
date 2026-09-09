import { Capacitor, registerPlugin } from "@capacitor/core";

interface IdolDaysWidgetBridgePlugin {
  updateWidget(options: WidgetNativePayload): Promise<{
    success: boolean;
    snapshotPath?: string;
  }>;
}

export interface WidgetNativePayload {
  idolName: string;
  eventTitle: string;
  dDay: string;
  eventDate: string;
  location: string;
  quote: string;
  imageData?: string;
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
