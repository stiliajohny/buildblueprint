import { byId } from "@/catalogue";

export const pwaDisplayIds = ["standalone", "fullscreen"] as const;

export const pwaOrientationIds = ["any", "portrait", "landscape"] as const;

export const pwaOfflineIds = ["online", "app-shell", "offline-page"] as const;

export const pwaUpdateIds = ["prompt", "automatic"] as const;

export const pwaInstallIds = ["browser", "in-app"] as const;

export type PwaDisplayId = (typeof pwaDisplayIds)[number];
export type PwaOrientationId = (typeof pwaOrientationIds)[number];
export type PwaOfflineId = (typeof pwaOfflineIds)[number];
export type PwaUpdateId = (typeof pwaUpdateIds)[number];
export type PwaInstallId = (typeof pwaInstallIds)[number];

type PwaChoice<Id extends string> = {
  id: Id;
  label: string;
  /** What the project pack should tell an agent to build. */
  guidance: string;
};

export const pwaDisplays: PwaChoice<PwaDisplayId>[] = [
  {
    id: "standalone",
    label: "Standalone window",
    guidance:
      "Open the installed app in its own window without the address bar. This is the display mode Chromium accepts for a normal install.",
  },
  {
    id: "fullscreen",
    label: "Full screen",
    guidance:
      "Hide browser controls and use the whole screen. Use this for a game or kiosk, not a normal product UI.",
  },
];

export const pwaOrientations: PwaChoice<PwaOrientationId>[] = [
  {
    id: "any",
    label: "Any",
    guidance: "Do not set a manifest orientation.",
  },
  {
    id: "portrait",
    label: "Portrait",
    guidance:
      "Set manifest orientation to portrait. Some installed Android apps follow it. Desktop ignores it, and iOS often ignores it.",
  },
  {
    id: "landscape",
    label: "Landscape",
    guidance:
      "Set manifest orientation to landscape. Some installed Android apps follow it. Desktop ignores it, and iOS often ignores it.",
  },
];

export const pwaOfflineModes: PwaChoice<PwaOfflineId>[] = [
  {
    id: "online",
    label: "Online only",
    guidance:
      "Register a service worker with a fetch handler so Chromium can install the app. Do not cache pages or API responses.",
  },
  {
    id: "app-shell",
    label: "App shell",
    guidance:
      "Precache the static shell. Load account data from the network. Do not cache authenticated responses.",
  },
  {
    id: "offline-page",
    label: "Offline page",
    guidance:
      "Precache one offline fallback page and show it when a navigation fails. Do not cache authenticated responses.",
  },
];

export const pwaUpdates: PwaChoice<PwaUpdateId>[] = [
  {
    id: "prompt",
    label: "Ask before reloading",
    guidance:
      "When a new service worker is waiting, ask the user to reload. Call skipWaiting only after they agree.",
  },
  {
    id: "automatic",
    label: "After the app closes",
    guidance:
      "Do not call skipWaiting. Let the new service worker take control after every tab of the app has closed.",
  },
];

export const pwaInstalls: PwaChoice<PwaInstallId>[] = [
  {
    id: "browser",
    label: "Browser menu",
    guidance:
      "Do not show a custom install banner. Chromium offers install from the address bar or the browser menu. iOS and iPadOS use Share, then Add to Home Screen. Safari has no beforeinstallprompt event.",
  },
  {
    id: "in-app",
    label: "In-app button",
    guidance:
      "On Chromium, keep the beforeinstallprompt event and call prompt() from a button click. iOS and iPadOS have no install event; explain Add to Home Screen instead.",
  },
];

/** True when at least one web framework is selected. */
export function hasWebClient(technologyIds: readonly string[]) {
  return technologyIds.some((id) => byId[id]?.category === "frontend");
}

/** Keep a same-origin path. Anything else becomes the site root. */
export function appPath(value: string) {
  const path = value.trim();
  if (
    path.length > 0 &&
    path.length <= 200 &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("\\") &&
    !path.includes("..") &&
    !/[\s#]/.test(path) &&
    /^\/[A-Za-z0-9/_\-.~%&=?]*$/.test(path)
  )
    return path;
  return "/";
}

/** Home-screen label. Prefer a whole word when the project name is long. */
export function homeScreenName(shortName: string, projectName: string) {
  const chosen = (shortName.trim() || projectName.trim()).replace(/\s+/g, " ");
  if (chosen.length <= 12) return chosen || "app";
  const first = chosen.split(" ")[0] ?? chosen;
  if (first.length > 0 && first.length <= 12) return first;
  return chosen.slice(0, 12);
}
