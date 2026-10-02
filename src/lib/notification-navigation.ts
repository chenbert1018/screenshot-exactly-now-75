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

        if (typeof route !== "string") return;

        const allowed =
          /^\/weather\/[^/?#]+$/.test(route) ||
          /^\/receive\/[A-Z0-9-]+$/.test(route) ||
          /^\/shared\/[a-f0-9]{48}$/.test(route);

        if (!allowed) return;

        void router.navigate({ to: route });
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
