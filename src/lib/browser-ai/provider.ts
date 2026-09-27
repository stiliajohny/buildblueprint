import type { AIProvider, AIRequest, AIChunk } from "@/lib/ai/types";
import { projectContext } from "@/lib/ai/context";
export type WorkerEvent = {
  type: "ready" | "progress" | "chunk" | "done" | "error";
  text?: string;
  message?: string;
  progress?: number;
};
export class BrowserAIProvider implements AIProvider {
  id = "browser";
  private ready = false;
  constructor(private worker: Worker) {}
  async available() {
    return this.ready;
  }
  load(model: string, onProgress: (n: number) => void) {
    return new Promise<void>((resolve, reject) => {
      const handler = (event: MessageEvent<WorkerEvent>) => {
        if (event.data.type === "progress")
          onProgress(event.data.progress ?? 0);
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
  async *generate(r: AIRequest): AsyncIterable<AIChunk> {
    if (!this.ready) throw new Error("Download a model first");
    const queue: WorkerEvent[] = [];
    let wake: () => void = () => {};
    const receive = (event: MessageEvent<WorkerEvent>) => {
      queue.push(event.data);
      wake();
    };
    const fail = () => {
      queue.push({ type: "error", message: "Browser worker failed." });
      wake();
    };
    const abort = () => {
      this.worker.terminate();
      this.ready = false;
      queue.push({ type: "error", message: "Generation stopped." });
      wake();
    };
    this.worker.addEventListener("message", receive);
    this.worker.addEventListener("error", fail);
    r.signal?.addEventListener("abort", abort);
    this.worker.postMessage({
      type: "generate",
      messages: [
        { role: "system", content: projectContext(r.project) },
        { role: "user", content: r.prompt },
      ],
    });
    try {
      while (true) {
        if (!queue.length)
          await new Promise<void>((resolve) => {
            wake = resolve;
          });
        const event = queue.shift();
        if (!event) continue;
        if (event.type === "chunk") yield { text: event.text ?? "" };
        if (event.type === "done") break;
        if (event.type === "error") throw new Error(event.message);
      }
    } finally {
      this.worker.removeEventListener("message", receive);
      this.worker.removeEventListener("error", fail);
      r.signal?.removeEventListener("abort", abort);
    }
  }
  dispose() {
    this.ready = false;
    this.worker.terminate();
  }
}
