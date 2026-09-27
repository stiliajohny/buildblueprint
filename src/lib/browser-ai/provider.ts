import type { AIProvider, AIRequest, AIChunk, ChatTurn } from "@/lib/ai/types";
import { projectContext } from "@/lib/ai/context";

export type WorkerEvent = {
  type: "ready" | "progress" | "chunk" | "done" | "error";
  text?: string;
  message?: string;
  progress?: number;
  file?: string;
};

/** Caps chat turns before they are posted to the local worker. */
export function sanitizeMessages(messages: ChatTurn[]) {
  return messages.slice(-12).map((message) => ({
    role:
      message.role === "system" || message.role === "assistant"
        ? message.role
        : "user",
    content: message.content.slice(0, 12000),
  }));
}

export class BrowserAIProvider implements AIProvider {
  id = "browser";
  private ready = false;
  constructor(private worker: Worker) {}
  async available() {
    return this.ready;
  }
  load(model: string, onProgress: (progress: number, file?: string) => void) {
    return new Promise<void>((resolve, reject) => {
      const handler = (event: MessageEvent<WorkerEvent>) => {
        if (event.data.type === "progress")
          onProgress(event.data.progress ?? 0, event.data.file);
        if (event.data.type === "ready" || event.data.type === "error") {
          cleanup();
          if (event.data.type === "ready") {
            this.ready = true;
            resolve();
          } else reject(new Error(event.data.message));
        }
      };
      const onError = () => {
        cleanup();
        reject(new Error("Model worker failed to load."));
      };
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Model download timed out. Please retry."));
      }, 600000);
      const cleanup = () => {
        clearTimeout(timeout);
        this.worker.removeEventListener("message", handler);
        this.worker.removeEventListener("error", onError);
      };
      this.worker.addEventListener("message", handler);
      this.worker.addEventListener("error", onError);
      this.worker.postMessage({ type: "load", model });
    });
  }
  async *generate(request: AIRequest): AsyncIterable<AIChunk> {
    if (!this.ready) throw new Error("Download a model first");
    const queue: WorkerEvent[] = [];
    let wake: () => void = () => {};
    let cancelled = false;
    const receive = (event: MessageEvent<WorkerEvent>) => {
      queue.push(event.data);
      wake();
    };
    const fail = () => {
      queue.push({ type: "error", message: "Browser worker failed." });
      wake();
    };
    const abort = () => {
      cancelled = true;
      this.worker.postMessage({ type: "cancel" });
    };
    this.worker.addEventListener("message", receive);
    this.worker.addEventListener("error", fail);
    request.signal?.addEventListener("abort", abort);
    const messages = sanitizeMessages(
      request.messages ?? [
        { role: "system", content: projectContext(request.project) },
        { role: "user", content: request.prompt },
      ],
    );
    this.worker.postMessage({
      type: "generate",
      messages,
      maxNewTokens: request.maxNewTokens ?? 384,
    });
    try {
      while (true) {
        if (!queue.length)
          await new Promise<void>((resolve) => {
            wake = resolve;
          });
        const event = queue.shift();
        if (!event) continue;
        if (event.type === "chunk" && !cancelled)
          yield { text: event.text ?? "" };
        if (event.type === "done") break;
        if (event.type === "error") throw new Error(event.message);
      }
    } finally {
      this.worker.removeEventListener("message", receive);
      this.worker.removeEventListener("error", fail);
      request.signal?.removeEventListener("abort", abort);
    }
  }
  dispose() {
    this.ready = false;
    this.worker.terminate();
  }
}
