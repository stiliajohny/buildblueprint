import type { Project } from "@/types/project";
export interface AIRequest {
  prompt: string;
  project: Project;
  signal?: AbortSignal;
}
export interface AIChunk {
  text: string;
}
export interface AIProvider {
  id: string;
  available(): Promise<boolean>;
  generate(request: AIRequest): AsyncIterable<AIChunk>;
}
