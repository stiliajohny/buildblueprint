import { describe, expect, it } from "vitest";
import { defaultProject, projectSchema } from "@/types/project";
import { generateFiles } from "@/features/generator";
import {
  browserLlmCookie,
  parseBrowserLlmChoice,
} from "@/lib/browser-ai/consent";
import { models } from "@/lib/browser-ai/models";
import { sanitizeMessages } from "@/lib/browser-ai/provider";
import { projectContext } from "@/lib/ai/context";
import {
  emptyEnhancementAnswers,
  promptDiscussion,
  refineMessages,
} from "@/lib/browser-ai/refine";

describe("browser model consent", () => {
  it("asks again until the cookie stores a real choice", () => {
    expect(parseBrowserLlmChoice(null)).toBeNull();
    expect(parseBrowserLlmChoice("bb-browser-llm=later")).toBeNull();
    expect(parseBrowserLlmChoice("declined")).toBe("declined");
    expect(parseBrowserLlmChoice("theme=light; bb-browser-llm=accepted")).toBe(
      "accepted",
    );
  });

  it("remembers the choice without downloading a model", () => {
    const cookie = browserLlmCookie("declined", true);
    expect(cookie).toContain("bb-browser-llm=declined");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Secure");
    expect(cookie).not.toContain("HttpOnly");
    expect(parseBrowserLlmChoice(cookie)).toBe("declined");
  });

  it("publishes size and licence for every local model", () => {
    for (const model of models) {
      expect(model.sizeMB).toBeGreaterThan(0);
      expect(model.revision).toHaveLength(40);
      expect(model.licence.name.length).toBeGreaterThan(0);
      expect(model.licence.url).toMatch(/^https:\/\//);
    }
  });
});

describe("local prompt rewrite", () => {
  it("asks the chat to rewrite the prompt from the review notes", () => {
    const message = promptDiscussion({
      ...emptyEnhancementAnswers(),
      audience: "clinic staff",
      outcome: "book a visit",
    });
    expect(message).toContain("Rewrite the master prompt");
    expect(message).toContain("clinic staff");
    expect(message).toContain("book a visit");
    expect(message).not.toContain("/api/ai");
  });

  it("gives the chat the live stack and the current master prompt", () => {
    const context = projectContext({
      ...defaultProject,
      refinedPrompt: "SAVED MASTER PROMPT",
    });
    expect(context).toContain("Next.js");
    expect(context).toContain("SAVED MASTER PROMPT");
    expect(context).toContain("Current master prompt:");
    expect(context).not.toContain("/api/ai");
  });

  it("includes the stack and the review answers in the worker payload", () => {
    const answers = {
      ...emptyEnhancementAnswers(),
      audience: "clinic staff",
      outcome: "book a visit",
      outOfScope: "billing",
      constraints: "no extra vendors",
    };
    const messages = refineMessages(
      defaultProject,
      answers,
      "CURRENT MASTER PROMPT",
    );
    const payload = JSON.stringify(messages);
    expect(messages[0].role).toBe("system");
    expect(payload).toContain("clinic staff");
    expect(payload).toContain("book a visit");
    expect(payload).toContain("billing");
    expect(payload).toContain("no extra vendors");
    expect(payload).toContain("Next.js");
    expect(payload).toContain("CURRENT MASTER PROMPT");
    expect(payload).not.toContain("/api/ai");
  });

  it("keeps only recent chat turns for the worker", () => {
    const messages = Array.from({ length: 20 }, (_, index) => ({
      role: "user" as const,
      content: `turn ${index} ${"x".repeat(13000)}`,
    }));
    const safe = sanitizeMessages(messages);
    expect(safe).toHaveLength(12);
    expect(safe[0].content).toHaveLength(12000);
    expect(safe.at(-1)?.content.startsWith("turn 19")).toBe(true);
  });

  it("uses a saved local rewrite as the master prompt", () => {
    const text =
      "Implement only the selected stack. Keep secrets on the server.";
    const files = generateFiles({ ...defaultProject, refinedPrompt: text });
    expect(files["prompts/bootstrap.md"]).toBe(text);
    expect(files["ide/generic/instructions.md"]).toBe(text);
    expect(files["prompts/implementation.md"]).not.toBe(text);
  });

  it("accepts saved projects that predate the refined prompt", () => {
    const { refinedPrompt: _removed, ...legacy } = defaultProject;
    expect(projectSchema.parse(legacy).refinedPrompt).toBe("");
    expect(generateFiles(defaultProject)["prompts/bootstrap.md"]).toContain(
      "STACK.yaml",
    );
  });
});
