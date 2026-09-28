"use client";
import { Button } from "@/components/ui/button";
import {
    emptyEnhancementAnswers,
    enhancementQuestions,
    promptDiscussion,
    refineSystemPrompt,
    type EnhancementAnswers,
} from "@/lib/browser-ai/refine";
import { useBuilder } from "@/stores/builder-store";
import { useState } from "react";

/** Review notes and system prompt for rewriting the master prompt on-device. */
export function PromptRefiner({
  onRefine,
  onDiscuss,
}: {
  onRefine: (answers: EnhancementAnswers, systemPrompt: string) => void;
  onDiscuss: (message: string) => void;
}) {
  const { project, update } = useBuilder();
  const [answers, setAnswers] = useState<EnhancementAnswers>(
    emptyEnhancementAnswers,
  );
  const [systemPrompt, setSystemPrompt] = useState(refineSystemPrompt);

  function setAnswer(id: keyof EnhancementAnswers, value: string) {
    setAnswers((current) => ({ ...current, [id]: value }));
  }

  return (
    <section className="prompt-enhance" aria-labelledby="prompt-enhance-title">
      <div>
        <h2 id="prompt-enhance-title">Refine the master prompt</h2>
        <p className="muted">
          Put the generated master prompt on the browser model with a system
          prompt. A reply becomes the exported prompt only after you choose
          Refine the master prompt.
        </p>
      </div>
      <label className="refine-system">
        System prompt
        <textarea
          rows={4}
          maxLength={2000}
          value={systemPrompt}
          aria-label="System prompt for refining the master prompt"
          onChange={(event) => setSystemPrompt(event.target.value)}
        />
      </label>
      <div className="enhance-questions">
        {enhancementQuestions.map((question) => (
          <label key={question.id}>
            {question.label}
            <textarea
              rows={2}
              maxLength={400}
              value={answers[question.id]}
              placeholder={question.placeholder}
              onChange={(event) => setAnswer(question.id, event.target.value)}
            />
          </label>
        ))}
      </div>
      <div className="refine-actions">
        <Button
          variant="primary"
          onClick={() => onRefine(answers, systemPrompt)}
        >
          Refine with LLM
        </Button>
        <Button onClick={() => onDiscuss(promptDiscussion(answers))}>
          Discuss in chat
        </Button>
      </div>
      {project.refinedPrompt && (
        <>
          <h3>Master prompt from chat</h3>
          <pre className="ai-response">{project.refinedPrompt}</pre>
          <Button onClick={() => update({ refinedPrompt: "" })}>
            Restore generated prompt
          </Button>
        </>
      )}
    </section>
  );
}
