"use client";
import { Button } from "@/components/ui/button";
import { projectContext } from "@/lib/ai/context";
import { writeBrowserLlmChoice } from "@/lib/browser-ai/consent";
import { models } from "@/lib/browser-ai/models";
import { skipBrowserModelAutoLoad } from "@/lib/browser-ai/preferences";
import {
  currentMasterPrompt,
  emptyEnhancementAnswers,
  extractRefinedPrompt,
  promptDiscussion,
  refineMaxNewTokens,
  refineMessages,
  refineSystemPrompt,
  wantsPromptRefine,
  type ChatSeed,
  type EnhancementAnswers,
} from "@/lib/browser-ai/refine";
import { browserLlm } from "@/lib/browser-ai/session";
import {
  claimChatSeed,
  getTranscript,
  releaseChatSeed,
  setTranscript,
  useTranscript,
} from "@/lib/browser-ai/transcript";
import { useBuilder } from "@/stores/builder-store";
import type { Project } from "@/types/project";
import { useEffect, useRef, useState } from "react";
import { ModelDownload } from "./model-download";
import { useBrowserLlm } from "./use-browser-llm";

const suggestions = [
  "Review my current choices",
  "What should I change in this stack?",
  "Refine the master prompt",
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
  seed?: ChatSeed | null;
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
      if (seed.mode === "refine") {
        void refine(
          seed.answers ?? emptyEnhancementAnswers(),
          seed.systemPrompt ?? refineSystemPrompt,
        );
      } else if (wantsPromptRefine(seed.text)) {
        void refine(emptyEnhancementAnswers(), refineSystemPrompt);
      } else void send(seed.text);
    } else setDraft(seed.text.slice(0, 2000));
    return () => {
      if (!started) releaseChatSeed(seed.id);
    };
  }, [live, seed, llm.status]);

  async function refine(
    answers: EnhancementAnswers,
    systemPrompt = refineSystemPrompt,
  ) {
    if (browserLlm.getSnapshot().status === "generating") return;
    setDraft("");
    setError("");
    const label = promptDiscussion(answers);
    const history = [
      ...getTranscript().filter((turn) => turn.role !== "system"),
      { role: "user" as const, content: label },
    ];
    setTranscript([...history, { role: "assistant", content: "" }]);
    let answer = "";
    try {
      for await (const chunk of browserLlm.generate({
        prompt: label,
        project,
        maxNewTokens: refineMaxNewTokens,
        messages: refineMessages(
          project,
          answers,
          currentMasterPrompt(project),
          systemPrompt,
        ),
      })) {
        answer += chunk.text;
        setTranscript([...history, { role: "assistant", content: answer }]);
      }
      const cleaned = extractRefinedPrompt(answer);
      if (!cleaned) {
        setError(
          "The local model did not return a prompt. Try again or use the 1.2B model.",
        );
        return;
      }
      if (cleaned !== answer.trim()) {
        setTranscript([...history, { role: "assistant", content: cleaned }]);
      }
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "The local model failed.",
      );
    }
  }

  async function send(text = draft) {
    const prompt = text.trim();
    if (!prompt || browserLlm.getSnapshot().status === "generating") return;
    if (wantsPromptRefine(prompt)) {
      await refine(emptyEnhancementAnswers(), refineSystemPrompt);
      return;
    }
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
        maxNewTokens: 512,
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
    const next = extractRefinedPrompt(text).slice(0, 20000);
    if (!next) {
      setError("Nothing to save as the master prompt yet.");
      return;
    }
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
            onClick={() => {
              skipBrowserModelAutoLoad();
              browserLlm.reset();
            }}
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
                  Ask about the choices in this blueprint, or refine the master
                  prompt with AI. Replies stay in this browser.
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
                savedText ===
                  extractRefinedPrompt(turn.content).slice(0, 20000);
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
                        Refine the master prompt
                      </Button>
                    )}
                  {saved && (
                    <p className="saved-note">Master prompt refined.</p>
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
              Your refine request is ready to send once the model loads.
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
