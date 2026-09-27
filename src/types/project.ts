import { z } from "zod";
import { byId } from "@/catalogue";
export const projectSchema = z.object({
  version: z.literal(1).default(1),
  projectName: z.string().trim().min(1).max(80),
  projectDescription: z.string().max(4000),
  projectType: z.enum([
    "saas",
    "internal",
    "ecommerce",
    "ai",
    "mobile",
    "website",
  ]),
  mode: z.enum(["guided", "expert"]),
  selectedTechnologies: z
    .array(z.string().refine((id) => Boolean(byId[id]), "Unknown technology"))
    .max(200)
    .transform((a) => [...new Set(a)]),
  selectedAuthMethods: z
    .array(
      z.enum([
        "email",
        "magic-link",
        "email-otp",
        "phone",
        "google",
        "apple",
        "facebook",
        "linkedin",
      ]),
    )
    .max(8),
  requirements: z.array(z.string().max(100)).max(30),
  deploymentProfile: z.enum(["managed", "self-hosted", "hybrid"]),
  security: z
    .array(
      z.enum([
        "rls",
        "validation",
        "secrets",
        "rate-limiting",
        "backups",
        "audit",
        "csp",
      ]),
    )
    .max(7),
  refinedPrompt: z.string().max(20000).default(""),
});
export type Project = z.infer<typeof projectSchema>;
export const defaultProject: Project = {
  version: 1,
  projectName: "my-project",
  projectDescription: "",
  projectType: "saas",
  mode: "expert",
  selectedTechnologies: [
    "nextjs",
    "supabase",
    "postgresql",
    "supabase-auth",
    "shadcn",
    "base-ui",
    "tailwind",
    "lucide",
    "zod",
    "zustand",
    "supabase-js",
    "supabase-ssr",
    "vercel",
    "cloudflare",
  ],
  selectedAuthMethods: ["email", "google"],
  requirements: ["accounts", "managed"],
  deploymentProfile: "managed",
  security: ["rls", "validation", "secrets", "rate-limiting", "backups"],
  refinedPrompt: "",
};
