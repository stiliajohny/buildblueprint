import { colorSchemes, type Palette } from "@/catalogue/color-schemes";
import {
  applyTheme,
  readThemePreference,
  THEME_STORAGE_KEY,
} from "@/lib/theme";
import { UI_STYLE_STORAGE_KEY } from "@/lib/ui-style-document";

const schemeIds = new Set(colorSchemes.map((scheme) => scheme.id));

const schemeProperties = [
  "--scheme-background",
  "--scheme-surface",
  "--scheme-text",
  "--scheme-muted",
  "--scheme-accent",
  "--scheme-on-accent",
] as const;

export type SchemeAppearance = {
  themeMode: string;
  singleTheme: string;
  colorScheme: string;
};

/** Bright or dark half of a colour pair, from the platform theme control. */
export function readPlatformTone(): "light" | "dark" {
  const theme = document.documentElement.dataset.theme;
  if (theme === "dark") return "dark";
  if (theme === "bright") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Palette to show for the selected pair, or null when none is selected. */
export function resolveSchemePalette(
  appearance: SchemeAppearance,
  tone: "light" | "dark",
): Palette | null {
  const scheme = colorSchemes.find(
    (item) => item.id === appearance.colorScheme,
  );
  if (!scheme) return null;
  if (appearance.themeMode === "single") {
    return appearance.singleTheme === "dark" ? scheme.dark : scheme.light;
  }
  return tone === "dark" ? scheme.dark : scheme.light;
}

function writePalette(palette: Palette) {
  const root = document.documentElement;
  const values: Record<(typeof schemeProperties)[number], string> = {
    "--scheme-background": palette.background,
    "--scheme-surface": palette.surface,
    "--scheme-text": palette.text,
    "--scheme-muted": palette.muted,
    "--scheme-accent": palette.accent,
    "--scheme-on-accent": palette.onAccent,
  };
  for (const property of schemeProperties) {
    root.style.setProperty(property, values[property]);
  }
}

function clearPalette() {
  const root = document.documentElement;
  delete root.dataset.colorScheme;
  for (const property of schemeProperties) root.style.removeProperty(property);
}

/**
 * Applies the selected colour pair to the document.
 * A single theme locks that mode. Light and dark follow the platform switch.
 */
export function applyColorScheme(appearance: SchemeAppearance) {
  const palette = resolveSchemePalette(appearance, readPlatformTone());
  const root = document.documentElement;
  if (!palette || !schemeIds.has(appearance.colorScheme)) {
    const hadScheme = root.dataset.colorScheme !== undefined;
    clearPalette();
    if (hadScheme) applyTheme(readThemePreference(), false);
    return;
  }
  root.dataset.colorScheme = appearance.colorScheme;
  writePalette(palette);
  if (appearance.themeMode === "single") {
    root.style.colorScheme =
      appearance.singleTheme === "dark" ? "dark" : "light";
    return;
  }
  applyTheme(readThemePreference(), false);
}

const schemePayload = Object.fromEntries(
  colorSchemes.map((scheme) => [
    scheme.id,
    { light: scheme.light, dark: scheme.dark },
  ]),
);

/** Runs before paint so a saved colour pair does not flash the default chrome. */
export const colorSchemeInitScript = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(UI_STYLE_STORAGE_KEY)});if(!raw)return;var data=JSON.parse(raw);var appearance=data&&data.state&&data.state.project&&data.state.project.appearance;if(!appearance)return;var schemes=${JSON.stringify(schemePayload)};var pair=schemes[appearance.colorScheme];if(!pair)return;var theme=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var dark=theme==="dark"||(theme!=="bright"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var mode=appearance.themeMode==="single"?(appearance.singleTheme==="dark"?"dark":"light"):(dark?"dark":"light");var palette=pair[mode];var root=document.documentElement;root.dataset.colorScheme=appearance.colorScheme;root.style.setProperty("--scheme-background",palette.background);root.style.setProperty("--scheme-surface",palette.surface);root.style.setProperty("--scheme-text",palette.text);root.style.setProperty("--scheme-muted",palette.muted);root.style.setProperty("--scheme-accent",palette.accent);root.style.setProperty("--scheme-on-accent",palette.onAccent);if(appearance.themeMode==="single")root.style.colorScheme=mode;}catch(e){}})();`;
