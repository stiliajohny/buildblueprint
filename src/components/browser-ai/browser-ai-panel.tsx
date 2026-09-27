"use client";
import { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { models } from "@/lib/browser-ai/models";
import { detectCapabilities } from "@/lib/browser-ai/capabilities";
import { BrowserAIProvider } from "@/lib/browser-ai/provider";
import {
  OpenAIProvider,
  DeepSeekProvider,
  OllamaProvider,
} from "@/lib/ai/providers";
import type { Project } from "@/types/project";
export function BrowserAIPanel({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}) {
  const [provider, setProvider] = useState("browser");
  const [model, setModel] = useState(models[0].id);
  const [capability, setCapability] = useState({
    available: false,
    message: "Checking device capabilities…",
    freeBytes: undefined as number | undefined,
  });
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("Model not downloaded");
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [prompt, setPrompt] = useState(
    "Why is this stack a good fit for my project?",
  );
  const [response, setResponse] = useState("");
  const [endpoint, setEndpoint] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("llama3.2");
  const worker = useRef<BrowserAIProvider | null>(null);
  const controller = useRef<AbortController | null>(null);
  const selected = models.find((m) => m.id === model)!;
  useEffect(() => {
    if (!open) return;
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
  }, [open]);
  useEffect(
    () => () => {
      worker.current?.dispose();
      controller.current?.abort();
    },
    [],
  );
  async function load() {
    setBusy(true);
    setStatus("Downloading model files…");
    setProgress(0);
    try {
      worker.current?.dispose();
      worker.current = new BrowserAIProvider(
        new Worker(new URL("../../lib/browser-ai/worker.ts", import.meta.url), {
          type: "module",
        }),
      );
      await worker.current.load(model, setProgress);
      setReady(true);
      setStatus("Local AI ready");
    } catch (e) {
      setStatus((e as Error).message);
      setReady(false);
    } finally {
      setBusy(false);
    }
  }
  async function ask() {
    setBusy(true);
    setResponse("");
    setStatus("Generating…");
    controller.current = new AbortController();
    try {
      const active =
        provider === "browser"
          ? worker.current
          : provider === "openai"
            ? new OpenAIProvider()
            : provider === "deepseek"
              ? new DeepSeekProvider()
              : new OllamaProvider(endpoint, ollamaModel);
      if (!active) throw new Error("Download a model first");
      for await (const chunk of active.generate({
        prompt,
        project,
        signal: controller.current.signal,
      })) {
        setResponse((text) => text + chunk.text);
      }
      setStatus(
        provider === "browser" ? "Local AI ready" : "Response complete",
      );
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Blueprint AI" open={open} onOpenChange={onOpenChange}>
      <div className="dialog-body">
        <label>
          Execution mode
          <select
            disabled={busy}
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              setConsent(false);
              setResponse("");
              setStatus("");
            }}
          >
            <option value="browser">Local browser · WebGPU</option>
            <option value="openai">OpenAI · Cloud</option>
            <option value="deepseek">DeepSeek · Cloud</option>
            <option value="ollama">Ollama · Local machine</option>
          </select>
        </label>
        {provider === "browser" ? (
          <>
            <p className="muted">
              Prompts and inference stay on your device. Model files are
              downloaded from Hugging Face and cached by the browser.
            </p>
            <div className="ai-status">
              {capability.message}
              {capability.freeBytes !== undefined && (
                <span>
                  {" "}
                  Approximately {Math.round(
                    capability.freeBytes / 1024 / 1024,
                  )}{" "}
                  MB of storage available.
                </span>
              )}
            </div>
            <label>
              Model
              <select
                disabled={busy}
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setReady(false);
                  setConsent(false);
                  worker.current?.dispose();
                  worker.current = null;
                }}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="muted">
              Approx. {selected.sizeMB} MB model download, plus runtime files.
              Memory use is higher. Licence:{" "}
              <a
                className="external"
                target="_blank"
                rel="noreferrer"
                href={selected.licence.url}
              >
                {selected.licence.name}
              </a>
            </p>
            {!ready && (
              <>
                <label className="flex gap-2 items-center">
                  <Checkbox
                    label="I agree to download this model under its licence"
                    checked={consent}
                    onCheckedChange={setConsent}
                  />
                  I agree to download this model under its licence.
                </label>
                <Button
                  variant="primary"
                  disabled={
                    busy ||
                    !consent ||
                    !capability.available ||
                    (capability.freeBytes !== undefined &&
                      capability.freeBytes < selected.sizeMB * 1024 * 1024)
                  }
                  onClick={load}
                >
                  {busy ? "Loading…" : "Download and load model"}
                </Button>
                {busy && (
                  <progress className="progress" value={progress} max={100} />
                )}
              </>
            )}
          </>
        ) : provider === "ollama" ? (
          <>
            <label>
              Local endpoint
              <input
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
              />
            </label>
            <label>
              Installed model
              <input
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
              />
            </label>
            <p className="muted">
              Keep Ollama bound to loopback. Allow this site’s exact origin with
              OLLAMA_ORIGINS. Never expose an unauthenticated Ollama server to
              the internet.
            </p>
            <label className="flex gap-2">
              <Checkbox
                label="Allow local Ollama connection"
                checked={consent}
                onCheckedChange={setConsent}
              />
              Allow this site to send my question and stack to my local Ollama
              server.
            </label>
          </>
        ) : (
          <>
            <p className="muted">
              Your question and current project configuration will be sent to{" "}
              {provider === "openai" ? "OpenAI" : "DeepSeek"}. Sign-in and
              server credentials are required. Limit: 20 requests per hour per
              account.
            </p>
            <label className="flex gap-2">
              <Checkbox
                label="Allow cloud AI request"
                checked={consent}
                onCheckedChange={setConsent}
              />
              Send my project context to this provider.
            </label>
          </>
        )}
        <label>
          Ask about your architecture
          <textarea
            maxLength={2000}
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </label>
        <Button
          variant="primary"
          disabled={
            busy ||
            !prompt.trim() ||
            (provider === "browser" ? !ready : !consent)
          }
          onClick={ask}
        >
          Ask Blueprint AI
        </Button>
        {busy && (
          <Button
            onClick={() => {
              controller.current?.abort();
              worker.current?.dispose();
              worker.current = null;
              setReady(false);
              setBusy(false);
              setStatus("Stopped. Reload the model to continue.");
            }}
          >
            Stop
          </Button>
        )}
        <div role="status" className="muted">
          {status}
        </div>
        {response && (
          <div className="ai-response" aria-live="polite">
            {response}
          </div>
        )}
      </div>
    </Modal>
  );
}
