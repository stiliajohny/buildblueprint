import {
    env,
    InterruptableStoppingCriteria,
    pipeline,
    TextStreamer,
    type TextGenerationPipeline,
} from "@huggingface/transformers";
import { models } from "./models";

env.allowLocalModels = false;
env.useBrowserCache = true;

type Incoming = {
  type: "load" | "generate" | "cancel";
  model?: string;
  messages?: { role: string; content: string }[];
  maxNewTokens?: number;
};

let generator: TextGenerationPipeline | null = null;
let stopping: InterruptableStoppingCriteria | null = null;
let busy = false;

self.onmessage = (event: MessageEvent<Incoming>) => {
  if (event.data.type === "cancel") {
    stopping?.interrupt();
    return;
  }
  if (busy) {
    self.postMessage({ type: "error", message: "Worker is busy" });
    return;
  }
  void run(event.data);
};

/** Loads a consented model or streams a local completion. Prompts never leave this worker. */
async function run(data: Incoming) {
  busy = true;
  try {
    if (data.type === "load") {
      const model = models.find((item) => item.id === data.model);
      if (!model) throw new Error("Unknown model");
      if (generator) await generator.dispose();
      generator = await pipeline("text-generation", model.id, {
        revision: model.revision,
        device: "webgpu",
        dtype: model.dtype,
        progress_callback: (progress) => {
          if ("progress" in progress)
            self.postMessage({
              type: "progress",
              progress: progress.progress,
              file: "file" in progress ? progress.file : "",
            });
        },
      });
      self.postMessage({ type: "ready" });
      return;
    }
    if (!generator) throw new Error("Load a model first");
    stopping = new InterruptableStoppingCriteria();
    const streamer = new TextStreamer(generator.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (text) => self.postMessage({ type: "chunk", text }),
    });
    const maxNewTokens = Math.min(2048, Math.max(32, data.maxNewTokens ?? 384));
    await generator(data.messages ?? [], {
      max_new_tokens: maxNewTokens,
      do_sample: false,
      repetition_penalty: 1.05,
      return_full_text: false,
      streamer,
      stopping_criteria: stopping,
    });
    self.postMessage({ type: "done" });
  } catch (error) {
    if (stopping?.interrupted) {
      self.postMessage({ type: "done" });
    } else {
      self.postMessage({
        type: "error",
        message:
          error instanceof Error ? error.message : "Browser model failed",
      });
    }
  } finally {
    busy = false;
    stopping = null;
  }
}
