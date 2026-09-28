"use client";

import { useEffect, useState } from "react";
import { applyColorScheme } from "@/lib/color-scheme-document";
import { THEME_CHANGE_EVENT } from "@/lib/theme";
import { applyUiStyle } from "@/lib/ui-style-document";
import { useBuilder } from "@/stores/builder-store";

/** Mirrors the selected UI style and colour pair onto every page. */
export function UiStyleSync() {
  const uiStyle = useBuilder((state) => state.project.uiStyle);
  const appearance = useBuilder((state) => state.project.appearance);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(useBuilder.persist.hasHydrated());
    return useBuilder.persist.onFinishHydration(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const apply = () => {
      applyUiStyle(uiStyle);
      applyColorScheme(appearance);
    };
    apply();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener(THEME_CHANGE_EVENT, apply);
    media.addEventListener("change", apply);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, apply);
      media.removeEventListener("change", apply);
    };
  }, [ready, uiStyle, appearance]);

  return null;
}
