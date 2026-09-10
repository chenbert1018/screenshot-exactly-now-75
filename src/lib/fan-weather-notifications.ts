import type { IdolEvent } from "./events";
import type { FanWeatherInput } from "./fan-weather";

import {
  generateFanWeatherNotificationCopy,
} from "./fan-weather";

import {
  cancelFanWeatherNotification,
  scheduleFanWeatherNotification,
} from "./event-notifications";

type WeatherApiResponse = {
  ok?: boolean;
  weather?: FanWeatherInput;
};

/**
 * 使用真實 CWA 資料更新單一活動的 Fan Weather 通知。
 *
 * V1：
 * - weatherEnabled=false → 取消
 * - 缺少 city/date → 取消
 * - CWA 沒有資料 → 不製造假資料
 * - 有真實資料 → 排 D-1 21:00 local notification
 */
export async function refreshFanWeatherNotification(
  event: IdolEvent,
): Promise<number> {
  if (
    !event.weatherEnabled ||
    !event.city?.trim() ||
    !event.date
  ) {
    await cancelFanWeatherNotification(event.id);
    return 0;
  }

  try {
    const params = new URLSearchParams({
      city: event.city.trim(),
      date: event.date,
    });

    const response = await fetch(
      `/api/weather?${params.toString()}`,
    );

    if (!response.ok) {
      return 0;
    }

    const data =
      (await response.json()) as WeatherApiResponse;

    if (!data.ok || !data.weather) {
      return 0;
    }

    const copy =
      generateFanWeatherNotificationCopy(
        data.weather,
        event.title || "重要日子",
      );

    return await scheduleFanWeatherNotification(
      event,
      copy,
    );
  } catch (error) {
    console.error(
      "[IdolDays Fan Weather] Refresh failed:",
      error,
    );

    return 0;
  }
}
