import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import { getMigrationRecord } from "./idols.source";

const STORAGE_KEY = "idoldays.settings.v1";
const SKY_DEFAULT_MIGRATION_KEY = "idoldays.skyDefault.v1";

export type ThemeMode = "system" | "light" | "dark" | "sky";
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
  theme: "sky",
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
  { value: "sky", label: "Sky Blue", hint: "雲朵藍色系" },
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

/**
 * Sky Blue is now IdolDays' default. Existing installations used `system` as
 * the old default, so promote that legacy value once instead of leaving users
 * unexpectedly on the former pink theme. They can still choose System again
 * afterwards from 外觀主題.
 */
function migrateLegacySystemTheme(settings: AppSettings): AppSettings {
  if (typeof window === "undefined" || settings.theme !== "system") return settings;
  try {
    if (window.localStorage.getItem(SKY_DEFAULT_MIGRATION_KEY)) return settings;
    window.localStorage.setItem(SKY_DEFAULT_MIGRATION_KEY, "1");
    return { ...settings, theme: "sky" };
  } catch {
    return settings;
  }
}

function write(value: AppSettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function normalize(value: Partial<AppSettings>): AppSettings {
  return {
    primaryIdolId: value.primaryIdolId ?? null,
    dateFormat: DATE_FORMAT_OPTIONS.some((option) => option.value === value.dateFormat)
      ? value.dateFormat as DateFormatMode
      : defaultSettings.dateFormat,
    language: LANGUAGE_OPTIONS.some((option) => option.value === value.language)
      ? value.language as LanguageMode
      : defaultSettings.language,
    theme: THEME_OPTIONS.some((option) => option.value === value.theme)
      ? value.theme as ThemeMode
      : defaultSettings.theme,
  };
}

function cloudPatch(settings: AppSettings) {
  return {
    main_idol_id: settings.primaryIdolId,
    date_format: settings.dateFormat,
    language: settings.language,
    theme: settings.theme,
  };
}

const listeners = new Set<(s: AppSettings) => void>();

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove("dark", "sky");
  if (theme === "sky") {
    document.documentElement.classList.add("sky");
    return;
  }
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches === true;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
}

export function useSettings() {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const local = migrateLegacySystemTheme(normalize(read()));
    write(local);
    setSettings(local);
    applyTheme(local.theme);

    if (!user?.id) {
      setReady(!authLoading);
      return () => { active = false; };
    }

    void (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("main_idol_id, date_format, language, theme")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;

      if (error) {
        setReady(true);
        return;
      }

      const localMap = getMigrationRecord(user.id).map;
      const migratedPrimary = local.primaryIdolId
        ? (localMap[local.primaryIdolId] ?? local.primaryIdolId)
        : null;
      const hasCloudSettings = Boolean(data?.main_idol_id) ||
        data?.date_format !== defaultSettings.dateFormat ||
        data?.language !== defaultSettings.language ||
        data?.theme !== defaultSettings.theme;
      const next = hasCloudSettings
        ? normalize({
            primaryIdolId: data?.main_idol_id ?? null,
            dateFormat: data?.date_format as DateFormatMode,
            language: data?.language as LanguageMode,
            theme: data?.theme === "system" ? "sky" : data?.theme as ThemeMode,
          })
        : { ...local, primaryIdolId: migratedPrimary };

      write(next);
      applyTheme(next.theme);
      setSettings(next);
      listeners.forEach((fn) => fn(next));

      // First signed-in use preserves the existing device preference in the profile.
      if (!hasCloudSettings) {
        void supabase.from("profiles").update(cloudPatch(next)).eq("user_id", user.id);
      } else if (data?.theme === "system") {
        // `system` was IdolDays' old default, not a separate visual identity.
        // Promote it once so the blue default stays consistent across devices.
        void supabase.from("profiles").update({ theme: "sky" }).eq("user_id", user.id);
      }
      setReady(true);
    })();

    const fn = (s: AppSettings) => setSettings(s);
    listeners.add(fn);
    return () => {
      active = false;
      listeners.delete(fn);
    };
  }, [user?.id, authLoading]);

  const update = useCallback((patch: Partial<AppSettings>) => {
    const next = normalize({ ...read(), ...patch });
    write(next);
    if (patch.theme) applyTheme(next.theme);
    listeners.forEach((fn) => fn(next));
    if (user?.id) {
      void supabase.from("profiles").update(cloudPatch(next)).eq("user_id", user.id);
    }
  }, [user?.id]);

  return { settings, ready, update };
}

export function formatWithSetting(date: string, mode: DateFormatMode): string {
  const [y, m, d] = date.split("-");
  if (!y || !m || !d) return date;
  if (mode === "slash") return `${y}/${m}/${d}`;
  if (mode === "zh") return `${y} 年 ${Number(m)} 月 ${Number(d)} 日`;
  return `${y}.${m}.${d}`;
}
