import type { CapacitorConfig } from "@capacitor/cli";

/**
 * IdolDays — Capacitor V1 (iOS wrapper)
 *
 * The web app is a TanStack Start SSR application, so there is no static
 * `index.html` bundle to embed. The iOS WebView therefore loads the hosted
 * IdolDays deployment directly (same origin as the web app), which keeps the
 * existing Supabase connection, localStorage fallback and migration records
 * working exactly as they do in the browser.
 *
 * `webDir` only holds a tiny offline placeholder that is shown when the device
 * has no network connection.
 */
const APP_URL =
  process.env["CAPACITOR_SERVER_URL"] ??
  "https://project--341000bb-c956-4427-b4cd-b832d297664e.lovable.app";

const config: CapacitorConfig = {
  appId: "com.idoldays.app",
  appName: "IdolDays",
  webDir: "ios-www",
  ios: {
    contentInset: "always",
    limitsNavigationsToAppBoundDomains: false,
  },
  server: {
    url: APP_URL,
    cleartext: false,
  },
};

export default config;
