import type { Project } from "@/types/project";
export interface ChatTurn {
  role: "system" | "user" | "assistant";
  content: string;
}
export interface AIRequest {
  prompt: string;
  project: Project;
  signal?: AbortSignal;
  messages?: ChatTurn[];
  maxNewTokens?: number;
}
export interface AIChunk {
  text: string;
}
export interface AIProvider {
  id: string;
  available(): Promise<boolean>;
  generate(request: AIRequest): AsyncIterable<AIChunk>;
}
