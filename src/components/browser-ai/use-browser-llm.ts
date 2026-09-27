"use client";
import { useEffect, useState } from "react";
import { browserLlm, type BrowserLlmSnapshot } from "@/lib/browser-ai/session";

/** Subscribes a component to the shared in-browser model session. */
export function useBrowserLlm() {
  const [snapshot, setSnapshot] = useState<BrowserLlmSnapshot>(() =>
    browserLlm.getSnapshot(),
  );
  useEffect(
    () => browserLlm.subscribe(() => setSnapshot(browserLlm.getSnapshot())),
    [],
  );
  return snapshot;
}
