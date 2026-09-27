export const THEME_STORAGE_KEY = "bb-theme";

export const themePreferences = ["bright", "dark", "system"] as const;

export type ThemePreference = (typeof themePreferences)[number];

/** Returns true when the value is a stored theme preference. */
export function isThemePreference(
  value: string | null,
): value is ThemePreference {
  return value === "bright" || value === "dark" || value === "system";
}

/**
 * Applies a preference on the document.
 * System mode leaves the resolved scheme to the browser.
 */
export function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  root.dataset.themePreference = preference;
  if (preference === "system") {
    root.removeAttribute("data-theme");
    root.style.colorScheme = "";
    return;
  }
  root.dataset.theme = preference;
  root.style.colorScheme = preference === "dark" ? "dark" : "light";
}

/** Reads the saved preference, defaulting to the operating system. */
export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(value) ? value : "system";
  } catch {
    return "system";
  }
}

/** Saves a preference and applies it immediately. */
export function persistTheme(preference: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    /* Storage can be blocked; the choice still applies to this document. */
  }
  applyTheme(preference);
}

/** Runs before paint so an explicit theme does not flash the wrong scheme. */
export const themeInitScript = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");if(p!=="dark"&&p!=="bright"&&p!=="system")p="system";var h=document.documentElement;h.dataset.themePreference=p;if(p==="system"){h.removeAttribute("data-theme");h.style.colorScheme="";}else{h.dataset.theme=p;h.style.colorScheme=p==="dark"?"dark":"light";}}catch(e){}})();`;
