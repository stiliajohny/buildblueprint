import { models } from "./models";

export const BROWSER_MODEL_STORAGE_KEY = "bb-browser-model";
export const AI_PANEL_STORAGE_KEY = "bb-ai-panel";

/** One auto-restore attempt per full page load. */
let browserModelAutoLoadUsed = false;

const providers = ["openai", "deepseek", "ollama"] as const;

export type AiPanelProvider = (typeof providers)[number];

export type AiPanelPreferences = {
  provider: AiPanelProvider;
  endpoint: string;
  ollamaModel: string;
};

const defaultPanel: AiPanelPreferences = {
  provider: "openai",
  endpoint: "http://localhost:11434",
  ollamaModel: "llama3.2",
};

/** Returns a known catalogue id, or the default model when storage is empty. */
export function readBrowserModelId(): string {
  try {
    const value = localStorage.getItem(BROWSER_MODEL_STORAGE_KEY);
    if (value && models.some((model) => model.id === value)) return value;
  } catch {
    /* Storage can be blocked. */
  }
  return models[0].id;
}

/** Remembers the last browser model the user selected or loaded. */
export function writeBrowserModelId(modelId: string) {
  if (!models.some((model) => model.id === modelId)) return;
  try {
    localStorage.setItem(BROWSER_MODEL_STORAGE_KEY, modelId);
  } catch {
    /* Storage can be blocked; the choice still applies to this visit. */
  }
}

/**
 * Returns true once per page load so a previously accepted model can reload
 * from cache. Returns false after Change model or a prior restore attempt.
 */
export function takeBrowserModelAutoLoad() {
  if (browserModelAutoLoadUsed) return false;
  browserModelAutoLoadUsed = true;
  return true;
}

/** Blocks auto-restore for the rest of this page load (e.g. Change model). */
export function skipBrowserModelAutoLoad() {
  browserModelAutoLoadUsed = true;
}

/** Reads cloud / Ollama panel choices for this browser. */
export function readAiPanelPreferences(): AiPanelPreferences {
  try {
    const raw = localStorage.getItem(AI_PANEL_STORAGE_KEY);
    if (!raw) return { ...defaultPanel };
    const parsed = JSON.parse(raw) as Partial<AiPanelPreferences>;
    return {
      provider: isProvider(parsed.provider)
        ? parsed.provider
        : defaultPanel.provider,
      endpoint:
        typeof parsed.endpoint === "string" && parsed.endpoint.trim()
          ? parsed.endpoint.trim()
          : defaultPanel.endpoint,
      ollamaModel:
        typeof parsed.ollamaModel === "string" && parsed.ollamaModel.trim()
          ? parsed.ollamaModel.trim()
          : defaultPanel.ollamaModel,
    };
  } catch {
    return { ...defaultPanel };
  }
}

/** Saves cloud / Ollama panel choices for later visits on this browser. */
export function writeAiPanelPreferences(prefs: AiPanelPreferences) {
  try {
    localStorage.setItem(
      AI_PANEL_STORAGE_KEY,
      JSON.stringify({
        provider: prefs.provider,
        endpoint: prefs.endpoint.trim() || defaultPanel.endpoint,
        ollamaModel: prefs.ollamaModel.trim() || defaultPanel.ollamaModel,
      }),
    );
  } catch {
    /* Storage can be blocked. */
  }
}

function isProvider(value: unknown): value is AiPanelProvider {
  return (
    typeof value === "string" &&
    (providers as readonly string[]).includes(value)
  );
}
