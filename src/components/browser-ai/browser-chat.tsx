"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { projectContext } from "@/lib/ai/context";
import { browserLlm } from "@/lib/browser-ai/session";
import {
  claimChatSeed,
  getTranscript,
  releaseChatSeed,
  setTranscript,
  useTranscript,
} from "@/lib/browser-ai/transcript";
import { writeBrowserLlmChoice } from "@/lib/browser-ai/consent";
import { models } from "@/lib/browser-ai/models";
import { useBuilder } from "@/stores/builder-store";
import type { Project } from "@/types/project";
import { ModelDownload } from "./model-download";
import { useBrowserLlm } from "./use-browser-llm";

const suggestions = [
  "Review my current choices",
  "What should I change in this stack?",
  "Rewrite the master prompt",
];

/** Docked on-device chat for stack choices and the master prompt. */
export function BrowserChat({
  project,
  live = true,
  seed,
  onCloud,
}: {
  project: Project;
  live?: boolean;
  seed?: { id: number; text: string } | null;
  onCloud?: () => void;
}) {
  const llm = useBrowserLlm();
  const turns = useTranscript();
  const { update } = useBuilder();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [savedText, setSavedText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const model = models.find((item) => item.id === llm.modelId);
  const ready = llm.status === "ready" || llm.status === "generating";
  const busy = llm.status === "generating";

  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [turns]);

  useEffect(() => {
    if (!live || !seed) return;
    if (llm.status === "generating" || llm.status === "downloading") return;
    if (!claimChatSeed(seed.id)) return;
    let started = false;
    if (llm.status === "ready") {
      started = true;
      void send(seed.text);
    } else setDraft(seed.text.slice(0, 2000));
    return () => {
      if (!started) releaseChatSeed(seed.id);
    };
  }, [live, seed, llm.status]);

  async function send(text = draft) {
    const prompt = text.trim();
    if (!prompt || browserLlm.getSnapshot().status === "generating") return;
    setDraft("");
    setError("");
    const history = [
      ...getTranscript().filter((turn) => turn.role !== "system"),
      { role: "user" as const, content: prompt },
    ];
    setTranscript([...history, { role: "assistant", content: "" }]);
    let answer = "";
    try {
      for await (const chunk of browserLlm.generate({
        prompt,
        project,
        maxNewTokens: /rewrite the master prompt/i.test(prompt) ? 768 : 384,
        messages: [
          { role: "system", content: projectContext(project) },
          ...history.slice(-8),
        ],
      })) {
        answer += chunk.text;
        setTranscript([...history, { role: "assistant", content: answer }]);
      }
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "The local model failed.",
      );
    }
  }

  function applyPrompt(text: string) {
    const next = text.trim().slice(0, 20000);
    update({ refinedPrompt: next });
    setSavedText(next);
  }

  return (
    <div className="chat-dock">
      <div className="llm-chat-bar">
        <strong>Chat</strong>
        <span>
          {ready ? (model?.name ?? "Browser model") : "On this device"}
        </span>
      </div>
      <div className="chat-actions">
        {turns.length > 0 && (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => setTranscript([])}
          >
            Clear chat
          </Button>
        )}
        {ready && (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => browserLlm.reset()}
          >
            Change model
          </Button>
        )}
        {onCloud && (
          <Button variant="ghost" onClick={onCloud}>
            Cloud or Ollama
          </Button>
        )}
      </div>
      {ready ? (
        <>
          <div className="llm-chat" role="log" aria-relevant="additions">
            {turns.length === 0 && (
              <>
                <p className="muted">
                  Ask about the choices in this blueprint, or rewrite the master
                  prompt. Replies stay in this browser.
                </p>
                <div className="chat-suggestions">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      disabled={busy}
                      onClick={() => void send(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </>
            )}
            {turns.map((turn, index) => {
              const saved =
                turn.role === "assistant" &&
                savedText.length > 0 &&
                savedText === turn.content.trim().slice(0, 20000);
              return (
                <div key={index} className={`llm-bubble ${turn.role}`}>
                  <strong>
                    {turn.role === "user" ? "You" : "Browser model"}
                  </strong>
                  <p>
                    {turn.content || (turn.role === "assistant" ? "…" : "")}
                  </p>
                  {turn.role === "assistant" &&
                    turn.content &&
                    !(busy && index === turns.length - 1) && (
                      <Button onClick={() => applyPrompt(turn.content)}>
                        Use as master prompt
                      </Button>
                    )}
                  {saved && (
                    <p className="saved-note">Saved as the master prompt.</p>
                  )}
                </div>
              );
            })}
            <div ref={end} />
          </div>
          <div className="llm-compose">
            <textarea
              aria-label="Message the browser model"
              rows={2}
              maxLength={2000}
              value={draft}
              placeholder="Ask about a choice or the master prompt"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
            />
            {busy ? (
              <Button onClick={() => browserLlm.stop()}>Stop</Button>
            ) : (
              <Button
                variant="primary"
                disabled={!draft.trim()}
                onClick={() => void send()}
              >
                Send
              </Button>
            )}
          </div>
          <div role="status" className="muted chat-status">
            {error || llm.message}
          </div>
        </>
      ) : (
        <div className="chat-setup">
          {draft && (
            <p className="muted">
              Your note is ready to send once the model loads.
            </p>
          )}
          <ModelDownload
            enabled={live}
            onReady={() => writeBrowserLlmChoice("accepted")}
          />
        </div>
      )}
    </div>
  );
}
