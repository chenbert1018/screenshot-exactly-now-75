import type { WeatherReminderTone } from "./events";

export type FanWeatherSettings = {
  locationName: string;
  city: string;
  weatherEnabled: boolean;
  weatherTone: WeatherReminderTone;
};

const STORAGE_KEY = "idoldays.fanWeather.v1";

type Store = Record<string, FanWeatherSettings>;

function readStore(): Store {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(store),
  );
}

export function getFanWeatherSettings(
  eventId: string,
): FanWeatherSettings | null {
  return readStore()[eventId] ?? null;
}

export function saveFanWeatherSettings(
  eventId: string,
  settings: FanWeatherSettings,
) {
  const store = readStore();

  store[eventId] = {
    locationName: settings.locationName.trim(),
    city: settings.city.trim(),
    weatherEnabled: settings.weatherEnabled,
    weatherTone: settings.weatherTone,
  };

  writeStore(store);
}

export function removeFanWeatherSettings(eventId: string) {
  const store = readStore();

  if (!(eventId in store)) return;

  delete store[eventId];
  writeStore(store);
}

export function mergeFanWeatherSettings<T extends { id: string }>(
  event: T,
): T & Partial<FanWeatherSettings> {
  const settings = getFanWeatherSettings(event.id);

  if (!settings) return event;

  return {
    ...event,
    ...settings,
  };
}
