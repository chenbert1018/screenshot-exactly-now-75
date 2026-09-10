import { LocalNotifications } from "@capacitor/local-notifications";
import type { AnyRouter } from "@tanstack/react-router";
import { useEffect } from "react";

export function useNotificationNavigation(router: AnyRouter): void {
  useEffect(() => {
    let disposed = false;
    let removeListener: (() => Promise<void>) | undefined;

    void LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (action) => {
        if (disposed) return;

        const route = action.notification.extra?.route;

        if (
          typeof route !== "string" ||
          !route.startsWith("/weather/")
        ) {
          return;
        }

        void router.navigate({
          to: route,
        });
      },
    ).then((handle) => {
      if (disposed) {
        void handle.remove();
        return;
      }

      removeListener = handle.remove;
    });

    return () => {
      disposed = true;
      if (removeListener) {
        void removeListener();
      }
    };
  }, [router]);
}
