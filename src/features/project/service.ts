import { projectSchema, type Project } from "@/types/project";
import { z } from "zod";
const savedSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  configuration: projectSchema,
  updated_at: z.string(),
});
export type SavedProject = z.infer<typeof savedSchema>;
async function request(path: string, init?: RequestInit) {
  const res = await fetch(path, init);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Project request failed");
  return data;
}
export async function saveProject(p: Project, id?: string): Promise<string> {
  const data = await request("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ configuration: projectSchema.parse(p), id }),
  });
  return z.object({ id: z.uuid() }).parse(data).id;
}
export async function listProjects() {
  return z.array(savedSchema).parse(await request("/api/projects"));
}
export async function getProject(id: string) {
  return savedSchema.parse(
    await request("/api/projects/" + encodeURIComponent(id)),
  );
}
export async function deleteProject(id: string) {
  await request("/api/projects/" + encodeURIComponent(id), {
    method: "DELETE",
  });
}
