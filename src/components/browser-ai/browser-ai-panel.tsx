"use client";
import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  OpenAIProvider,
  DeepSeekProvider,
  OllamaProvider,
} from "@/lib/ai/providers";
import {
  readAiPanelPreferences,
  writeAiPanelPreferences,
  type AiPanelProvider,
} from "@/lib/browser-ai/preferences";
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
  const [provider, setProvider] = useState<AiPanelProvider>("openai");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("");
  const [prompt, setPrompt] = useState(
    "Why is this stack a good fit for my project?",
  );
  const [response, setResponse] = useState("");
  const [endpoint, setEndpoint] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("llama3.2");
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    const saved = readAiPanelPreferences();
    setProvider(saved.provider);
    setEndpoint(saved.endpoint);
    setOllamaModel(saved.ollamaModel);
  }, []);

  useEffect(
    () => () => {
      controller.current?.abort();
    },
    [],
  );

  function persistPanel(next: {
    provider?: AiPanelProvider;
    endpoint?: string;
    ollamaModel?: string;
  }) {
    writeAiPanelPreferences({
      provider: next.provider ?? provider,
      endpoint: next.endpoint ?? endpoint,
      ollamaModel: next.ollamaModel ?? ollamaModel,
    });
  }

  async function ask() {
    setBusy(true);
    setResponse("");
    setStatus("Generating…");
    controller.current = new AbortController();
    try {
      const active =
        provider === "openai"
          ? new OpenAIProvider()
          : provider === "deepseek"
            ? new DeepSeekProvider()
            : new OllamaProvider(endpoint, ollamaModel);
      for await (const chunk of active.generate({
        prompt,
        project,
        signal: controller.current.signal,
      })) {
        setResponse((text) => text + chunk.text);
      }
      setStatus("Response complete");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Request failed");
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
            onChange={(event) => {
              const next = event.target.value as AiPanelProvider;
              setProvider(next);
              persistPanel({ provider: next });
              setConsent(false);
              setResponse("");
              setStatus("");
            }}
          >
            <option value="openai">OpenAI · Cloud</option>
            <option value="deepseek">DeepSeek · Cloud</option>
            <option value="ollama">Ollama · Local machine</option>
          </select>
        </label>
        {provider === "ollama" ? (
          <>
            <label>
              Local endpoint
              <input
                value={endpoint}
                onChange={(event) => {
                  const next = event.target.value;
                  setEndpoint(next);
                  persistPanel({ endpoint: next });
                }}
              />
            </label>
            <label>
              Installed model
              <input
                value={ollamaModel}
                onChange={(event) => {
                  const next = event.target.value;
                  setOllamaModel(next);
                  persistPanel({ ollamaModel: next });
                }}
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
                onCheckedChange={(checked) => setConsent(checked === true)}
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
                onCheckedChange={(checked) => setConsent(checked === true)}
              />
              Send my project context to this provider.
            </label>
          </>
        )}
        <>
          <label>
            Ask about your architecture
            <textarea
              maxLength={2000}
              rows={2}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
          </label>
          <Button
            variant="primary"
            disabled={busy || !prompt.trim() || !consent}
            onClick={() => void ask()}
          >
            Ask Blueprint AI
          </Button>
          {busy && (
            <Button
              onClick={() => {
                controller.current?.abort();
                setBusy(false);
                setStatus("Stopped.");
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
        </>
      </div>
    </Modal>
  );
}
