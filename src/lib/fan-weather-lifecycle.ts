import { useEffect, useRef } from "react";

import type { IdolEvent } from "./events";
import {
  refreshFanWeatherNotification,
} from "./fan-weather-notifications";

/**
 * 避免短時間內重複刷新同一批 CWA。
 */
const REFRESH_COOLDOWN_MS = 60_000;

export function useFanWeatherLifecycle(
  events: IdolEvent[],
  ready: boolean,
): void {
  const eventsRef = useRef(events);
  const readyRef = useRef(ready);
  const lastRefreshRef = useRef(0);
  const runningRef = useRef(false);

  useEffect(() => {
    eventsRef.current = events;
    readyRef.current = ready;
  }, [events, ready]);

  useEffect(() => {
    let disposed = false;

    const refresh = async () => {
      if (
        disposed ||
        !readyRef.current ||
        runningRef.current
      ) {
        return;
      }

      const now = Date.now();

      if (
        now - lastRefreshRef.current <
        REFRESH_COOLDOWN_MS
      ) {
        return;
      }

      const targets =
        eventsRef.current.filter(
          (event) =>
            event.weatherEnabled &&
            Boolean(event.city?.trim()) &&
            Boolean(event.date),
        );

      if (targets.length === 0) {
        lastRefreshRef.current = now;
        return;
      }

      runningRef.current = true;

      try {
        for (const event of targets) {
          if (disposed) break;

          await refreshFanWeatherNotification(
            event,
          );
        }

        lastRefreshRef.current = Date.now();
      } catch (error) {
        console.error(
          "[IdolDays Fan Weather] Lifecycle refresh failed:",
          error,
        );
      } finally {
        runningRef.current = false;
      }
    };

    /**
     * App / WebView 第一次進入時檢查。
     */
    void refresh();

    /**
     * Capacitor WebView 從背景回到前景時，
     * document 會重新變成 visible。
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      disposed = true;

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, []);
}
