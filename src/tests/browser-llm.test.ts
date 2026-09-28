import { generateFiles } from "@/features/generator";
import { projectContext } from "@/lib/ai/context";
import {
  browserLlmCookie,
  parseBrowserLlmChoice,
} from "@/lib/browser-ai/consent";
import { models } from "@/lib/browser-ai/models";
import {
  readAiPanelPreferences,
  readBrowserModelId,
  skipBrowserModelAutoLoad,
  takeBrowserModelAutoLoad,
  writeAiPanelPreferences,
  writeBrowserModelId,
} from "@/lib/browser-ai/preferences";
import { sanitizeMessages } from "@/lib/browser-ai/provider";
import {
  currentMasterPrompt,
  emptyEnhancementAnswers,
  extractRefinedPrompt,
  promptDiscussion,
  refineMaxNewTokens,
  refineMessages,
  refineSystemPrompt,
  wantsPromptRefine,
} from "@/lib/browser-ai/refine";
import { defaultProject, projectSchema } from "@/types/project";
import { describe, expect, it, vi } from "vitest";

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

  it("remembers the selected browser model in localStorage", () => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    });
    expect(readBrowserModelId()).toBe(models[0].id);
    writeBrowserModelId(models[1].id);
    expect(readBrowserModelId()).toBe(models[1].id);
    writeBrowserModelId("not-a-real-model");
    expect(readBrowserModelId()).toBe(models[1].id);
    vi.unstubAllGlobals();
  });

  it("remembers cloud and Ollama panel choices in localStorage", () => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    });
    writeAiPanelPreferences({
      provider: "ollama",
      endpoint: "http://127.0.0.1:11434",
      ollamaModel: "mistral",
    });
    expect(readAiPanelPreferences()).toEqual({
      provider: "ollama",
      endpoint: "http://127.0.0.1:11434",
      ollamaModel: "mistral",
    });
    vi.unstubAllGlobals();
  });

  it("only auto-loads a cached browser model once per page visit", () => {
    expect(takeBrowserModelAutoLoad()).toBe(true);
    expect(takeBrowserModelAutoLoad()).toBe(false);
    skipBrowserModelAutoLoad();
    expect(takeBrowserModelAutoLoad()).toBe(false);
  });
});

describe("local prompt rewrite", () => {
  it("asks the chat to rewrite the prompt from the review notes", () => {
    const message = promptDiscussion({
      ...emptyEnhancementAnswers(),
      audience: "clinic staff",
      outcome: "book a visit",
    });
    expect(message).toContain("Refine the master prompt");
    expect(message).toContain("clinic staff");
    expect(message).toContain("book a visit");
    expect(message).not.toContain("/api/ai");
  });

  it("routes refine requests onto the dedicated rewrite path", () => {
    expect(wantsPromptRefine("Refine the master prompt")).toBe(true);
    expect(wantsPromptRefine("rewrite the master prompt")).toBe(true);
    expect(wantsPromptRefine("What should I change?")).toBe(false);
    expect(refineMaxNewTokens).toBeGreaterThanOrEqual(2048);
    expect(refineSystemPrompt).toContain("complete improved master prompt");
  });

  it("strips chat fluff before saving a refined prompt", () => {
    expect(
      extractRefinedPrompt(
        "Here is the revised master prompt:\n\n```markdown\nBuild the app.\n```",
      ),
    ).toBe("Build the app.");
    expect(
      extractRefinedPrompt("The refined prompt: Implement the selected stack."),
    ).toBe("Implement the selected stack.");
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
    expect(messages[0].content).toBe(refineSystemPrompt);
    expect(payload).toContain("clinic staff");
    expect(payload).toContain("book a visit");
    expect(payload).toContain("billing");
    expect(payload).toContain("no extra vendors");
    expect(payload).toContain("Next.js");
    expect(payload).toContain("CURRENT MASTER PROMPT");
    expect(payload).not.toContain("/api/ai");
  });

  it("accepts a custom system prompt for the refine pass", () => {
    const messages = refineMessages(
      defaultProject,
      emptyEnhancementAnswers(),
      "PROMPT",
      "Keep the stack exact and return only the prompt.",
    );
    expect(messages[0].content).toBe(
      "Keep the stack exact and return only the prompt.",
    );
  });

  it("reads the live master prompt for a refine pass", () => {
    expect(
      currentMasterPrompt({
        ...defaultProject,
        refinedPrompt: "SAVED MASTER PROMPT",
      }),
    ).toBe("SAVED MASTER PROMPT");
    expect(currentMasterPrompt(defaultProject)).toContain("STACK.yaml");
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
