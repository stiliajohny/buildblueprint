"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { detectCapabilities } from "@/lib/browser-ai/capabilities";
import { models } from "@/lib/browser-ai/models";
import { browserLlm } from "@/lib/browser-ai/session";
import { useBrowserLlm } from "./use-browser-llm";

/** Shows size, licence, and the consent gate before a model download starts. */
export function ModelDownload({
  enabled,
  onReady,
}: {
  enabled: boolean;
  onReady?: () => void;
}) {
  const llm = useBrowserLlm();
  const [model, setModel] = useState(models[0].id);
  const [consent, setConsent] = useState(false);
  const [capability, setCapability] = useState({
    available: false,
    message: "Checking device capabilities…",
    freeBytes: undefined as number | undefined,
  });
  const selected = models.find((item) => item.id === model) ?? models[0];
  const busy = llm.status === "downloading";
  const shortOnSpace =
    capability.freeBytes !== undefined &&
    capability.freeBytes < selected.sizeMB * 1024 * 1024;

  useEffect(() => {
    if (!enabled) return;
    const nav = navigator as Navigator & {
      gpu?: { requestAdapter: () => Promise<unknown> };
    };
    void detectCapabilities({
      secure: window.isSecureContext,
      gpu: nav.gpu,
      storage: navigator.storage,
    }).then((value) =>
      setCapability({
        ...value,
        freeBytes: "freeBytes" in value ? value.freeBytes : undefined,
      }),
    );
  }, [enabled]);

  async function load() {
    try {
      await browserLlm.load(model);
      onReady?.();
    } catch {
      setConsent(false);
    }
  }

  return (
    <>
      <p className="muted">
        Prompts and inference stay on your device. Model files download from
        Hugging Face and the browser caches them. Nothing is sent to
        BuildBlueprint.
      </p>
      <div className="ai-status">
        {capability.message}
        {capability.freeBytes !== undefined && (
          <span>
            {" "}
            Approximately {Math.round(capability.freeBytes / 1024 / 1024)} MB of
            storage available.
          </span>
        )}
      </div>
      <label>
        Model
        <select
          disabled={busy}
          value={model}
          onChange={(event) => {
            setModel(event.target.value);
            setConsent(false);
          }}
        >
          {models.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.sizeMB} MB
            </option>
          ))}
        </select>
      </label>
      <p className="muted">
        {selected.description} About {selected.sizeMB} MB, plus runtime files.
        Licence:{" "}
        <a target="_blank" rel="noreferrer" href={selected.licence.url}>
          {selected.licence.name}
        </a>
      </p>
      <label className="flex gap-2 items-center">
        <Checkbox
          label="I agree to download this model under its licence"
          checked={consent}
          onCheckedChange={(checked) => setConsent(checked === true)}
        />
        I agree to download this model under its licence.
      </label>
      <Button
        variant="primary"
        disabled={busy || !consent || !capability.available || shortOnSpace}
        onClick={() => void load()}
      >
        {busy ? "Loading…" : "Download and load model"}
      </Button>
      {busy && (
        <>
          <progress
            className="progress"
            value={llm.progress}
            max={100}
            aria-label="Model download progress"
          />
          <Button onClick={() => browserLlm.reset()}>Stop download</Button>
        </>
      )}
      <div role="status" className="muted">
        {llm.message}
      </div>
    </>
  );
}
