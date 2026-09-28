import type { Project } from "@/types/project";

export const projectTypeLabels: Record<Project["projectType"], string> = {
  saas: "SaaS application",
  internal: "Internal company tool",
  ecommerce: "E-commerce",
  ai: "AI application",
  mobile: "Mobile product",
  website: "Website",
};

const questions = [
  {
    id: "mobile",
    label: "Do you need mobile apps?",
    technology: "expo",
    types: ["mobile"],
  },
  {
    id: "accounts",
    label: "Do users need accounts?",
    technology: "supabase-auth",
    types: ["saas", "internal", "ecommerce", "ai", "mobile"],
  },
  {
    id: "payments",
    label: "Do you need payments?",
    technology: "stripe",
    types: ["saas", "ecommerce", "ai", "mobile"],
  },
  {
    id: "ai",
    label: "Do you need AI?",
    technology: "openai",
    types: ["saas", "ai"],
  },
  {
    id: "realtime",
    label: "Do you expect realtime data?",
    technology: "supabase",
    types: ["saas"],
  },
  {
    id: "sensitive-data",
    label: "Will you handle sensitive data?",
    technology: "",
    types: ["saas", "internal", "ecommerce", "ai"],
  },
  {
    id: "offline",
    label: "Do you need offline functionality?",
    technology: "",
    types: ["internal", "mobile"],
  },
  {
    id: "data-heavy-dashboard",
    label: "Will you display large data tables?",
    technology: "tanstack-table",
    types: ["internal"],
  },
  {
    id: "private-ai",
    label: "Should AI run locally?",
    technology: "browser-ai",
    types: ["ai"],
  },
] as const;

export type RequirementQuestion = (typeof questions)[number];

/** Requirement questions that belong to one project type. */
export function questionsFor(type: Project["projectType"]) {
  return questions.filter((question) =>
    (question.types as readonly string[]).includes(type),
  );
}
