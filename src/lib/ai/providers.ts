import type { AIProvider, AIRequest, AIChunk } from "./types";
import { projectContext } from "./context";
export class CloudProvider implements AIProvider {
  constructor(public id: "openai" | "deepseek") {}
  async available() {
    const r = await fetch("/api/ai");
    if (!r.ok) return false;
    const data = await r.json();
    return Boolean(data[this.id]);
  }
  async *generate(r: AIRequest): AsyncIterable<AIChunk> {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: this.id,
        prompt: r.prompt,
        project: r.project,
      }),
      signal: r.signal,
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Cloud AI request failed");
    }
    if (!response.body) throw new Error("Empty AI response");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        yield { text: decoder.decode(value, { stream: true }) };
      }
      const tail = decoder.decode();
      if (tail) yield { text: tail };
    } finally {
      reader.releaseLock();
    }
  }
}
export class OpenAIProvider extends CloudProvider {
  constructor() {
    super("openai");
  }
}
export class DeepSeekProvider extends CloudProvider {
  constructor() {
    super("deepseek");
  }
}
export function validateOllamaEndpoint(endpoint: string) {
  const url = new URL(endpoint);
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("Use a loopback URL such as http://localhost:11434.");
  return url.origin;
}
export class OllamaProvider implements AIProvider {
  id = "ollama";
  endpoint: string;
  constructor(
    endpoint: string,
    private model: string,
  ) {
    this.endpoint = validateOllamaEndpoint(endpoint);
  }
  async available() {
    try {
      return (
        await fetch(this.endpoint + "/api/tags", {
          signal: AbortSignal.timeout(3000),
        })
      ).ok;
    } catch {
      return false;
    }
  }
  async *generate(r: AIRequest): AsyncIterable<AIChunk> {
    const res = await fetch(this.endpoint + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: projectContext(r.project) },
          { role: "user", content: r.prompt },
        ],
        stream: true,
        options: { num_predict: 512 },
      }),
      signal: r.signal,
    });
    if (!res.ok || !res.body)
      throw new Error(
        "Ollama could not respond. Check the model name and CORS configuration.",
      );
    let pending = "";
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { value, done } = await reader.read();
        pending += done
          ? decoder.decode()
          : decoder.decode(value, { stream: true });
        const lines = pending.split("\n");
        pending = done ? "" : (lines.pop() ?? "");
        for (const line of lines) {
          if (!line.trim()) continue;
          const data = JSON.parse(line);
          if (data.error) throw new Error(data.error);
          if (data.message?.content) yield { text: data.message.content };
        }
        if (done) break;
      }
    } finally {
      reader.releaseLock();
    }
  }
}
