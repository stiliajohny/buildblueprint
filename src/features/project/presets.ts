import { defaultProject, type Project } from "@/types/project";
import { dependencies } from "@/features/compatibility";
const base = [
  "nextjs",
  "pnpm",
  "shadcn",
  "base-ui",
  "tailwind",
  "lucide",
  "zod",
  "zustand",
];
export const presets = [
  {
    id: "nextjs-saas",
    name: "Next.js SaaS",
    description: "Subscriptions, accounts and a managed backend.",
    ids: [
      "supabase",
      "supabase-auth",
      "stripe",
      "resend",
      "sentry",
      "vercel",
      "cloudflare",
    ],
  },
  {
    id: "nextjs-supabase",
    name: "Next.js + Supabase",
    description: "A focused full-stack starting point.",
    ids: ["supabase", "supabase-auth", "supabase-ssr", "vercel"],
  },
  {
    id: "privacy-first",
    name: "Privacy-first SaaS",
    description: "Self-hosted data and privacy-focused analytics.",
    ids: ["supabase", "supabase-auth", "umami", "glitchtip", "kubernetes"],
    profile: "self-hosted",
  },
  {
    id: "local-ai",
    name: "Local AI application",
    description: "Inference on your machine or in the browser.",
    ids: ["ollama", "browser-ai", "sqlite", "tauri"],
    type: "ai",
    profile: "self-hosted",
  },
  {
    id: "mobile-first",
    name: "Mobile-first product",
    description: "Native clients with a shared backend.",
    ids: ["expo", "supabase", "supabase-auth", "sentry"],
    type: "mobile",
  },
  {
    id: "internal-tool",
    name: "Internal company tool",
    description: "Data tables, identity and access controls.",
    ids: ["supabase", "supabase-auth", "tanstack-table", "tanstack-query"],
    type: "internal",
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Payments, transactional email and product data.",
    ids: ["supabase", "supabase-auth", "stripe", "resend", "vercel"],
    type: "ecommerce",
  },
  {
    id: "ai-saas",
    name: "AI SaaS",
    description: "Cloud AI with billing and observability.",
    ids: [
      "supabase",
      "supabase-auth",
      "openai",
      "deepseek",
      "stripe",
      "sentry",
      "vercel",
    ],
    type: "ai",
  },
  {
    id: "self-hosted",
    name: "Self-hosted stack",
    description: "Operate your own application and data.",
    ids: [
      "supabase",
      "supabase-auth",
      "minio",
      "grafana",
      "kubernetes",
      "opentofu",
    ],
    profile: "self-hosted",
  },
  {
    id: "enterprise",
    name: "Enterprise stack",
    description: "SSO, feature management and observability.",
    ids: [
      "postgresql",
      "workos",
      "flagsmith",
      "openfeature",
      "datadog",
      "aws",
      "terraform",
    ],
    profile: "hybrid",
  },
  {
    id: "simple-mvp",
    name: "Simple MVP",
    description: "A small stack for validating an idea.",
    ids: ["supabase", "supabase-auth", "vercel"],
  },
] as const;
export function fromPreset(id: string): Project {
  const p = presets.find((p) => p.id === id);
  if (!p) return { ...defaultProject };
  return {
    ...defaultProject,
    projectName: "my-project",
    projectType: "type" in p ? p.type : "saas",
    deploymentProfile: "profile" in p ? p.profile : "managed",
    selectedTechnologies: dependencies([...base, ...p.ids]),
  };
}
