import {
  pipeline,
  TextStreamer,
  env,
  type TextGenerationPipeline,
} from "@huggingface/transformers";
import { models } from "./models";
env.allowLocalModels = false;
env.useBrowserCache = true;
let generator: TextGenerationPipeline | null = null;
let busy = false;
self.onmessage = async (
  event: MessageEvent<{
    type: "load" | "generate";
    model?: string;
    messages?: { role: string; content: string }[];
  }>,
) => {
  if (busy) {
    self.postMessage({ type: "error", message: "Worker is busy" });
    return;
  }
  busy = true;
  try {
    if (event.data.type === "load") {
      const model = models.find((m) => m.id === event.data.model);
      if (!model) throw new Error("Unknown model");
      if (generator) await generator.dispose();
      generator = await pipeline("text-generation", model.id, {
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
    } else {
      if (!generator) throw new Error("Load a model first");
      const streamer = new TextStreamer(generator.tokenizer, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (text) => self.postMessage({ type: "chunk", text }),
      });
      await generator(event.data.messages ?? [], {
        max_new_tokens: 384,
        do_sample: false,
        repetition_penalty: 1.05,
        streamer,
      });
      self.postMessage({ type: "done" });
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Browser model failed",
    });
  } finally {
    busy = false;
  }
};
