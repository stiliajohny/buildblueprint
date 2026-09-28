import { z } from "zod";
import { byId } from "@/catalogue";
import {
  appPath,
  pwaInstallIds,
  pwaOrientationIds,
  pwaUpdateIds,
} from "@/catalogue/pwa";
import { authMethodIds } from "@/catalogue/provider-options";
import { automationStageIds } from "@/catalogue/automation";
import { uiStyleIds } from "@/catalogue/ui-styles";

const appPathSchema = z.string().max(200).default("/").transform(appPath);

export const pwaSchema = z.object({
  enabled: z.boolean().default(false),
  shortName: z.string().trim().max(12).default(""),
  display: z
    .enum(["standalone", "fullscreen", "minimal-ui", "browser"])
    .default("standalone")
    .transform((value) =>
      value === "fullscreen" ? "fullscreen" : "standalone",
    ),
  orientation: z.enum(pwaOrientationIds).default("any"),
  startUrl: appPathSchema,
  offline: z
    .enum(["online", "app-shell", "offline-page", "offline-first"])
    .default("app-shell")
    .transform((value) =>
      value === "online" || value === "app-shell" || value === "offline-page"
        ? value
        : "offline-page",
    ),
  updates: z.enum(pwaUpdateIds).default("prompt"),
  install: z.enum(pwaInstallIds).default("browser"),
  maskableIcons: z.boolean().default(true),
  themeFromPalette: z.boolean().default(true),
  shareTarget: z.boolean().default(false),
});

export const defaultPwa: z.infer<typeof pwaSchema> = {
  enabled: false,
  shortName: "",
  display: "standalone",
  orientation: "any",
  startUrl: "/",
  offline: "app-shell",
  updates: "prompt",
  install: "browser",
  maskableIcons: true,
  themeFromPalette: true,
  shareTarget: false,
};

export const appearanceSchema = z.object({
  themeMode: z
    .enum(["single", "light-dark", "light-dark-system"])
    .default("light-dark"),
  singleTheme: z.enum(["light", "dark"]).default("light"),
  colorScheme: z.string().max(80).default(""),
});

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
  selectedAuthMethods: z.array(z.enum(authMethodIds)).max(16),
  selectedProviderOptions: z
    .record(z.string().max(80), z.array(z.string().max(40)).max(20))
    .default({}),
  appearance: appearanceSchema.default({
    themeMode: "light-dark",
    singleTheme: "light",
    colorScheme: "",
  }),
  uiStyle: z.enum(uiStyleIds).default(""),
  pwa: pwaSchema.default(defaultPwa),
  requirements: z.array(z.string().max(100)).max(30),
  deploymentProfile: z.enum(["managed", "self-hosted", "hybrid"]),
  automationStages: z
    .array(z.enum(automationStageIds))
    .max(automationStageIds.length)
    .default([])
    .transform((ids) =>
      automationStageIds.filter((id) => new Set(ids).has(id)),
    ),
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
    "pnpm",
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
  selectedProviderOptions: {},
  appearance: {
    themeMode: "light-dark",
    singleTheme: "light",
    colorScheme: "",
  },
  uiStyle: "",
  pwa: defaultPwa,
  requirements: ["accounts", "managed"],
  deploymentProfile: "managed",
  automationStages: [],
  security: ["rls", "validation", "secrets", "rate-limiting", "backups"],
  refinedPrompt: "",
};
