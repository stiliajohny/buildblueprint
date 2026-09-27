"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  emptyEnhancementAnswers,
  enhancementQuestions,
  promptDiscussion,
  type EnhancementAnswers,
} from "@/lib/browser-ai/refine";
import { useBuilder } from "@/stores/builder-store";

/** Review notes that open the chat so it can revise the master prompt. */
export function PromptRefiner({
  onDiscuss,
}: {
  onDiscuss: (message: string) => void;
}) {
  const { project, update } = useBuilder();
  const [answers, setAnswers] = useState<EnhancementAnswers>(
    emptyEnhancementAnswers,
  );

  function setAnswer(id: keyof EnhancementAnswers, value: string) {
    setAnswers((current) => ({ ...current, [id]: value }));
  }

  return (
    <section className="prompt-enhance" aria-labelledby="prompt-enhance-title">
      <div>
        <h2 id="prompt-enhance-title">Enhance the master prompt</h2>
        <p className="muted">
          Add notes, then continue in the chat. A reply becomes the exported
          prompt only after you choose Use as master prompt.
        </p>
      </div>
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
      <Button
        variant="primary"
        onClick={() => onDiscuss(promptDiscussion(answers))}
      >
        Discuss in chat
      </Button>
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
