import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "idoldays.settings.v1";

export type ThemeMode = "system" | "light" | "dark";
export type DateFormatMode = "dot" | "slash" | "zh";
export type LanguageMode = "zh-TW" | "en";

export type AppSettings = {
  primaryIdolId: string | null;
  dateFormat: DateFormatMode;
  language: LanguageMode;
  theme: ThemeMode;
};

export const defaultSettings: AppSettings = {
  primaryIdolId: null,
  dateFormat: "dot",
  language: "zh-TW",
  theme: "system",
};

export const DATE_FORMAT_OPTIONS: { value: DateFormatMode; label: string; sample: string }[] = [
  { value: "dot", label: "2026.09.07", sample: "2026.09.07" },
  { value: "slash", label: "2026/09/07", sample: "2026/09/07" },
  { value: "zh", label: "2026 年 9 月 7 日", sample: "2026 年 9 月 7 日" },
];

export const LANGUAGE_OPTIONS: { value: LanguageMode; label: string }[] = [
  { value: "zh-TW", label: "繁體中文" },
  { value: "en", label: "English" },
];

export const THEME_OPTIONS: { value: ThemeMode; label: string; hint: string }[] = [
  { value: "system", label: "系統", hint: "跟著手機設定" },
  { value: "light", label: "淺色", hint: "溫柔奶油色" },
  { value: "dark", label: "深色", hint: "夜晚模式" },
];

function read(): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

function write(value: AppSettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

const listeners = new Set<(s: AppSettings) => void>();

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches === true;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = read();
    setSettings(initial);
    applyTheme(initial.theme);
    setReady(true);
    const fn = (s: AppSettings) => setSettings(s);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const update = useCallback((patch: Partial<AppSettings>) => {
    const next = { ...read(), ...patch };
    write(next);
    if (patch.theme) applyTheme(next.theme);
    listeners.forEach((fn) => fn(next));
  }, []);

  return { settings, ready, update };
}

export function formatWithSetting(date: string, mode: DateFormatMode): string {
  const [y, m, d] = date.split("-");
  if (!y || !m || !d) return date;
  if (mode === "slash") return `${y}/${m}/${d}`;
  if (mode === "zh") return `${y} 年 ${Number(m)} 月 ${Number(d)} 日`;
  return `${y}.${m}.${d}`;
}
