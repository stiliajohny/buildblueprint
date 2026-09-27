import type { AIChunk, AIRequest } from "@/lib/ai/types";
import { BrowserAIProvider } from "./provider";

export type BrowserLlmSnapshot = {
  status: "idle" | "downloading" | "ready" | "generating" | "error";
  modelId: string | null;
  progress: number;
  file: string;
  message: string;
};

const initialSnapshot: BrowserLlmSnapshot = {
  status: "idle",
  modelId: null,
  progress: 0,
  file: "",
  message: "Model not downloaded",
};

/** Shares one Web Worker across the landing download, chat, and prompt rewrite. */
class BrowserLlmSession {
  private provider: BrowserAIProvider | null = null;
  private snapshot: BrowserLlmSnapshot = initialSnapshot;
  private listeners = new Set<() => void>();
  private controller: AbortController | null = null;
  private loadToken = 0;

  getSnapshot() {
    return this.snapshot;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Downloads a model only after the caller has collected licence consent. */
  async load(modelId: string) {
    if (
      this.snapshot.status === "ready" &&
      this.snapshot.modelId === modelId &&
      this.provider
    )
      return;
    if (this.snapshot.status === "downloading") return;
    const token = ++this.loadToken;
    this.provider?.dispose();
    this.provider = null;
    this.set({
      status: "downloading",
      modelId,
      progress: 0,
      file: "",
      message: "Downloading model files…",
    });
    const provider = new BrowserAIProvider(
      new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
    );
    this.provider = provider;
    try {
      await provider.load(modelId, (progress, file) => {
        if (token !== this.loadToken) return;
        this.set({
          progress,
          file: file ?? "",
          message: file ? `Downloading ${file}` : "Downloading model files…",
        });
      });
      if (token !== this.loadToken) return;
      this.set({
        status: "ready",
        modelId,
        progress: 100,
        message: "Local AI ready",
      });
    } catch (error) {
      if (this.provider === provider) {
        provider.dispose();
        this.provider = null;
      }
      if (token !== this.loadToken) return;
      this.set({
        status: "error",
        modelId: null,
        progress: 0,
        message:
          error instanceof Error ? error.message : "Model download failed",
      });
      throw error;
    }
  }

  async *generate(request: AIRequest): AsyncIterable<AIChunk> {
    if (!this.provider) throw new Error("Download a model first");
    if (this.controller) throw new Error("The model is already responding");
    const controller = new AbortController();
    this.controller = controller;
    this.set({ status: "generating", message: "Generating…" });
    try {
      if (!(await this.provider.available()))
        throw new Error("Download a model first");
      yield* this.provider.generate({ ...request, signal: controller.signal });
      this.set({ status: "ready", message: "Local AI ready" });
    } catch (error) {
      this.set({
        status: this.provider ? "ready" : "error",
        message: error instanceof Error ? error.message : "Generation failed",
      });
      throw error;
    } finally {
      if (this.controller === controller) this.controller = null;
    }
  }

  stop() {
    this.controller?.abort();
  }

  reset() {
    this.loadToken += 1;
    this.controller?.abort();
    this.controller = null;
    this.provider?.dispose();
    this.provider = null;
    this.set(initialSnapshot);
  }

  private set(patch: Partial<BrowserLlmSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const listener of this.listeners) listener();
  }
}

export const browserLlm = new BrowserLlmSession();
