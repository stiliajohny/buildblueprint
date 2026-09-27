import type { Project } from "@/types/project";
export interface RecommendationRule {
  id: string;
  when: {
    selected?: string[];
    capabilities?: string[];
    projectTypes?: string[];
  };
  recommend?: string[];
  discourage?: string[];
  require?: string[];
  message: string;
  priority: number;
}
export const rules: RecommendationRule[] = [
  {
    id: "next-supabase-ssr",
    when: { selected: ["nextjs", "supabase"] },
    recommend: ["supabase-js", "supabase-ssr", "zod"],
    message:
      "Supabase SSR and Zod help with server authentication and validated input.",
    priority: 80,
  },
  {
    id: "dashboard-table",
    when: { capabilities: ["data-heavy-dashboard"] },
    recommend: ["tanstack-table", "tanstack-query"],
    message: "TanStack Table and Query suit data-heavy dashboards.",
    priority: 50,
  },
  {
    id: "mobile",
    when: { capabilities: ["mobile"] },
    recommend: ["expo"],
    message: "Expo shares React expertise across web and native clients.",
    priority: 70,
  },
  {
    id: "payments",
    when: { capabilities: ["payments"] },
    recommend: ["stripe"],
    message: "Stripe supports subscriptions and one-off payments.",
    priority: 60,
  },
  {
    id: "ai",
    when: { capabilities: ["ai"] },
    recommend: ["openai"],
    message:
      "A cloud provider gives you a straightforward starting point for AI.",
    priority: 50,
  },
  {
    id: "local",
    when: { capabilities: ["private-ai"] },
    recommend: ["ollama", "browser-ai"],
    message: "Local inference keeps prompts on the user’s device.",
    priority: 90,
  },
  {
    id: "flags",
    when: { selected: ["flagsmith"] },
    recommend: ["openfeature"],
    message: "OpenFeature keeps flag evaluation portable.",
    priority: 40,
  },
  {
    id: "realtime",
    when: { capabilities: ["realtime"] },
    recommend: ["supabase"],
    message: "Supabase combines relational data with realtime subscriptions.",
    priority: 60,
  },
];
export function recommendations(p: Project) {
  return rules
    .filter(
      (r) =>
        (r.when.selected ?? []).every((id) =>
          p.selectedTechnologies.includes(id),
        ) &&
        (r.when.capabilities ?? []).every((id) =>
          p.requirements.includes(id),
        ) &&
        (!r.when.projectTypes || r.when.projectTypes.includes(p.projectType)),
    )
    .map((r) => ({
      ...r,
      recommend: (r.recommend ?? []).filter(
        (id) => !p.selectedTechnologies.includes(id),
      ),
    }))
    .filter((r) => r.recommend.length)
    .sort((a, b) => b.priority - a.priority);
}
