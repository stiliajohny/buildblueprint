import { describe, it, expect } from "vitest";
import { parse } from "yaml";
import { catalogue, byId } from "@/catalogue";
import { automationStageIds, automationStages } from "@/catalogue/automation";
import { uiStyles } from "@/catalogue/ui-styles";
import { colorSchemes } from "@/catalogue/color-schemes";
import { optionsFor } from "@/catalogue/provider-options";
import { questionsFor } from "@/features/project/requirements";
import { technologySchema } from "@/types/technology";
import { defaultProject, projectSchema, type Project } from "@/types/project";
import { compatibility, dependencies } from "@/features/compatibility";
import { recommendations } from "@/features/recommendations";
import { canonical, generateFiles, slug } from "@/features/generator";
import { presets, fromPreset } from "@/features/project/presets";
import { detectCapabilities } from "@/lib/browser-ai/capabilities";
import { validateOllamaEndpoint } from "@/lib/ai/providers";
import { boundedJson, validOrigin } from "@/lib/http";
const project = (patch: Partial<Project> = {}): Project => ({
  ...defaultProject,
  ...patch,
});

/** WCAG contrast ratio for two #RRGGBB colours. */
function contrast(a: string, b: string) {
  const channel = (hex: string, start: number) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (hex: string) =>
    0.2126 * channel(hex, 1) +
    0.7152 * channel(hex, 3) +
    0.0722 * channel(hex, 5);
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
describe("catalogue integrity", () => {
  it("validates every technology and unique ID", () => {
    expect(catalogue.length).toBeGreaterThanOrEqual(120);
    expect(new Set(catalogue.map((t) => t.id)).size).toBe(catalogue.length);
    for (const technology of catalogue)
      expect(technologySchema.safeParse(technology).success).toBe(true);
  });
  it("has no dangling relationships", () => {
    for (const t of catalogue)
      for (const id of [
        ...t.alternatives,
        ...(t.requires ?? []),
        ...(t.implies ?? []),
        ...(t.conflictsWith ?? []),
      ])
        expect(byId[id]).toBeDefined();
  });
  it("validates every template", () => {
    for (const p of presets)
      expect(projectSchema.safeParse(fromPreset(p.id)).success).toBe(true);
  });
  it("gives every identity and AI provider its own options", () => {
    for (const technology of catalogue.filter(
      (item) => item.category === "auth" || item.category === "ai",
    ))
      expect(optionsFor(technology.id).length).toBeGreaterThan(0);
    const supabase = optionsFor("supabase-auth").map((option) => option.id);
    const workos = optionsFor("workos").map((option) => option.id);
    expect(supabase).toContain("facebook");
    expect(workos).not.toContain("facebook");
    expect(workos).toContain("sso");
    expect(optionsFor("anthropic").map((option) => option.id)).toEqual([
      "chat",
      "vision",
    ]);
    expect(optionsFor("openai").map((option) => option.id)).toContain("images");
  });
});
describe("rules", () => {
  it("adds Supabase Database with its platform and Postgres", () => {
    expect(byId["supabase-db"]?.category).toBe("database");
    const result = dependencies(["supabase-db"]);
    expect(result).toEqual(
      expect.arrayContaining(["supabase-db", "supabase", "postgresql"]),
    );
    expect(new Set(result).size).toBe(result.length);
  });
  it("resolves recursive requirements without duplicates", () => {
    const result = dependencies(["supabase-ssr", "supabase"]);
    expect(result).toEqual(
      expect.arrayContaining(["supabase-js", "supabase", "postgresql"]),
    );
    expect(new Set(result).size).toBe(result.length);
  });
  it("detects missing requirements", () => {
    expect(
      compatibility(project({ selectedTechnologies: ["supabase-ssr"] })).status,
    ).toBe("conflict");
  });
  it("warns on competing authentication providers", () => {
    const result = compatibility(
      project({
        selectedTechnologies: dependencies(["supabase-auth", "firebase-auth"]),
      }),
    );
    expect(
      result.messages.some((m) => m.message.includes("primary identity")),
    ).toBe(true);
  });
  it("blocks React libraries in a Vue stack", () => {
    expect(
      compatibility(
        project({ selectedTechnologies: dependencies(["nuxt", "shadcn"]) }),
      ).status,
    ).toBe("conflict");
  });
  it("flags SaaS dependencies in a self-hosted profile", () => {
    expect(
      compatibility(project({ deploymentProfile: "self-hosted" })).status,
    ).toBe("warning");
  });
  it("recognises the default stack", () => {
    expect(compatibility(defaultProject).status).toBe("compatible");
  });
  it("rejects more than one JavaScript runtime", () => {
    expect(
      compatibility(
        project({
          selectedTechnologies: ["nextjs", "npm", "pnpm"],
        }),
      ).status,
    ).toBe("conflict");
  });
  it("warns when Deno is paired with a Node web framework", () => {
    expect(
      compatibility(
        project({ selectedTechnologies: ["nextjs", "deno"] }),
      ).messages.some((message) => message.message.includes("Deno")),
    ).toBe(true);
  });
  it("recommends only missing libraries", () => {
    const p = project({ selectedTechnologies: ["nextjs", "supabase"] });
    expect(recommendations(p)[0].recommend).toContain("supabase-ssr");
    expect(
      recommendations(defaultProject).flatMap((r) => r.recommend),
    ).not.toContain("supabase-ssr");
  });
  it("limits requirement questions to the project type", () => {
    expect(questionsFor("website")).toEqual([]);
    expect(questionsFor("saas").map((question) => question.id)).not.toContain(
      "mobile",
    );
    expect(questionsFor("mobile").map((question) => question.id)).toContain(
      "mobile",
    );
    expect(questionsFor("internal").map((question) => question.id)).toContain(
      "data-heavy-dashboard",
    );
  });
  it("matches requirement predicates", () => {
    expect(
      recommendations(project({ requirements: ["data-heavy-dashboard"] })).some(
        (r) => r.id === "dashboard-table",
      ),
    ).toBe(true);
  });
});
describe("generation", () => {
  it("round trips canonical YAML including hostile punctuation", () => {
    const p = project({
      projectName: "demo: #project",
      projectDescription: 'description: "quoted"\nmultiline',
    });
    const f = generateFiles(p);
    expect(parse(f["STACK.yaml"])).toEqual(canonical(p));
    expect(f["PROJECT.md"]).toContain(p.projectDescription);
    expect(f["prompts/bootstrap.md"]).toContain("STACK.yaml");
  });
  it("writes the selected UI style into the prompt", () => {
    const f = generateFiles(project({ uiStyle: "neumorphism" }));
    expect(parse(f["STACK.yaml"]).ui.style).toBe("neumorphism");
    expect(f["prompts/bootstrap.md"]).toContain("## UI style");
    expect(f["prompts/bootstrap.md"]).toContain("Neumorphism");
    expect(f["prompts/bootstrap.md"]).toContain("--neu-bg");
    expect(f["rules/frontend.md"]).toContain("--neu-bg");
    expect(f["prompts/bootstrap.md"]).not.toContain("Claymorphism");
    const rewritten = generateFiles({
      ...defaultProject,
      uiStyle: "bento",
      refinedPrompt: "Build the selected stack.",
    });
    expect(rewritten["prompts/bootstrap.md"]).toContain(
      "Build the selected stack.",
    );
    expect(rewritten["prompts/bootstrap.md"]).toContain(".bento");
    expect(generateFiles(defaultProject)["prompts/bootstrap.md"]).not.toContain(
      "## UI style",
    );
    const glass = generateFiles(project({ uiStyle: "glassmorphism" }));
    expect(glass["prompts/bootstrap.md"]).toContain("backdrop-filter: blur");
    expect(glass["prompts/bootstrap.md"]).toContain("Do not blur a full");
    expect(glass["rules/frontend.md"]).toContain("@supports not");
    for (const style of uiStyles) {
      expect(
        generateFiles(project({ uiStyle: style.id }))["prompts/bootstrap.md"],
      ).toContain(style.name);
    }
  });
  it("includes every core deliverable and IDE instruction", () => {
    const f = generateFiles(defaultProject);
    for (const name of [
      "PROJECT.md",
      "ARCHITECTURE.md",
      "STACK.yaml",
      "AGENTS.md",
      "README.md",
      ".env.example",
      "rules/security.md",
      "rules/database.md",
      "rules/ai.md",
      "prompts/bootstrap.md",
      "ide/codex/AGENTS.md",
      "docs/SECURITY.md",
      "docs/CODE_STYLE.md",
      "docs/DATABASE.md",
      "docs/API.md",
      "docs/THREAT_MODEL.md",
      "docs/SECURITY_ARCHITECTURE.md",
      "docs/SECURITY_CHECKLIST.md",
    ])
      expect(f[name]).toBeTruthy();
    expect(f["AGENTS.md"]).toContain("docs/SECURITY.md");
    expect(f["docs/SECURITY.md"]).toContain("Supabase Auth");
    expect(f["docs/SECURITY.md"]).toContain("Zod");
    expect(f["docs/API.md"]).not.toContain("/api/v1/projects");
    expect(f["docs/DATABASE.md"]).toContain("No tables are defined yet");
  });
  it("keeps unselected providers out of the agent docs", () => {
    const bare = generateFiles(
      project({
        selectedTechnologies: ["nextjs"],
        security: [],
        selectedAuthMethods: [],
      }),
    );
    expect(bare["docs/SECURITY.md"]).not.toContain("Supabase");
    expect(bare["docs/SECURITY.md"]).not.toContain("OPENAI_API_KEY");
    expect(bare["docs/DATABASE.md"]).toContain("No database is selected");
    expect(bare["docs/SECURITY_CHECKLIST.md"]).toContain("Not in this stack");
    const paid = generateFiles(
      project({ selectedTechnologies: ["nextjs", "openai", "stripe"] }),
    );
    expect(paid["docs/SECURITY.md"]).toContain("OpenAI");
    expect(paid["docs/SECURITY.md"]).toContain("Stripe");
    expect(paid["docs/API.md"]).toContain("OPENAI_API_KEY");
  });
  it("generates infrastructure only when selected", () => {
    expect(generateFiles(defaultProject)["Dockerfile"]).toBeUndefined();
    const f = generateFiles(
      project({
        selectedTechnologies: [
          ...defaultProject.selectedTechnologies,
          "kubernetes",
          "terraform",
        ],
      }),
    );
    expect(f["Dockerfile"]).toContain("USER node");
    expect(parse(f["kubernetes/deployment.yaml"]).kind).toBe("Deployment");
    expect(f["terraform/main.tf"]).toContain("required_version");
  });
  it("does not leak unselected provider secrets", () => {
    expect(
      generateFiles(project({ selectedTechnologies: ["nextjs"] }))[
        ".env.example"
      ],
    ).not.toContain("OPENAI_API_KEY");
    expect(
      generateFiles(project({ selectedTechnologies: ["openai"] }))[
        ".env.example"
      ],
    ).toContain("OPENAI_API_KEY=");
  });
  it("writes install commands for the selected JavaScript runtime", () => {
    const npm = generateFiles(
      project({ selectedTechnologies: ["nextjs", "npm", "kubernetes"] }),
    );
    expect(npm[".github/workflows/ci.yml"]).toContain("npm ci");
    expect(npm.Dockerfile).toContain("npm ci");
    expect(parse(npm["STACK.yaml"]).toolchain.javascript).toEqual({
      runtime: "node",
      packageManager: "npm",
    });
    const bun = generateFiles(
      project({ selectedTechnologies: ["nextjs", "bun"] }),
    );
    expect(bun[".github/workflows/ci.yml"]).toContain(
      "bun install --frozen-lockfile",
    );
    expect(bun["rules/frontend.md"]).toContain("bun");
    const deno = generateFiles(project({ selectedTechnologies: ["deno"] }));
    expect(deno[".github/workflows/ci.yml"]).toContain("deno task build");
  });
  it("sanitizes archive paths", () => {
    expect(slug("../../Hello / World")).toBe("hello-world");
  });
  it("records the theme choice and drops security controls the stack does not use", () => {
    expect(generateFiles(defaultProject)["rules/frontend.md"]).toContain(
      "light and dark",
    );
    const bare = canonical(
      project({
        selectedTechnologies: ["nextjs"],
        security: ["rls", "validation", "csp"],
      }),
    );
    expect(bare.security).toEqual(["validation", "csp"]);
    expect(bare.ui.theme).toEqual({ mode: "light-dark" });
    const themed = project({
      appearance: {
        ...defaultProject.appearance,
        colorScheme: "synthetic-lime",
      },
    });
    expect(canonical(themed).ui.colorScheme).toBe("synthetic-lime");
    expect(canonical(themed).ui.palette?.dark.background).toBe("#0C1410");
    expect(canonical(themed).ui.palette?.light.accent).not.toBe(
      canonical(themed).ui.palette?.dark.accent,
    );
    expect(generateFiles(themed)["rules/frontend.md"]).toContain(
      "Synthetic Lime and Bio Black",
    );
  });
  it("defines a readable light and dark palette for each colour pair", () => {
    expect(colorSchemes).toHaveLength(6);
    expect(new Set(colorSchemes.map((scheme) => scheme.id)).size).toBe(6);
    for (const scheme of colorSchemes)
      for (const mode of ["light", "dark"] as const) {
        const palette = scheme[mode];
        for (const color of Object.values(palette))
          expect(color).toMatch(/^#[0-9A-F]{6}$/);
        expect(
          contrast(palette.text, palette.background),
        ).toBeGreaterThanOrEqual(4.5);
        expect(contrast(palette.text, palette.surface)).toBeGreaterThanOrEqual(
          4.5,
        );
        expect(
          contrast(palette.muted, palette.background),
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrast(palette.onAccent, palette.accent),
        ).toBeGreaterThanOrEqual(4.5);
      }
    for (const scheme of colorSchemes) {
      expect(scheme.light.accent).not.toBe(scheme.dark.accent);
      expect(scheme.light.background).not.toBe(scheme.dark.background);
    }
  });
  it("records a progressive web app only when a web framework is selected", () => {
    expect(canonical(defaultProject).clients.web.pwa).toBeUndefined();
    const enabled = project({
      pwa: {
        ...defaultProject.pwa,
        enabled: true,
        shortName: "Blueprint",
        display: "standalone",
        shareTarget: true,
      },
    });
    expect(canonical(enabled).clients.web.pwa).toMatchObject({
      shortName: "Blueprint",
      display: "standalone",
      startUrl: "/",
      scope: "/",
      shareTarget: true,
    });
    expect(generateFiles(enabled)["rules/frontend.md"]).toContain(
      "Progressive web app",
    );
    expect(generateFiles(enabled)["ARCHITECTURE.md"]).toContain(
      "Progressive web app: standalone",
    );
    const named = project({
      projectName: "Longer product name",
      pwa: { ...defaultProject.pwa, enabled: true, shortName: "" },
    });
    expect(canonical(named).clients.web.pwa?.shortName).toBe("Longer");
    const adjusted = projectSchema.parse({
      ...defaultProject,
      pwa: {
        ...defaultProject.pwa,
        display: "browser",
        offline: "offline-first",
        startUrl: "https://example.com",
        scope: "/app",
        categories: ["productivity"],
      },
    });
    expect(adjusted.pwa.display).toBe("standalone");
    expect(adjusted.pwa.offline).toBe("offline-page");
    expect(adjusted.pwa.startUrl).toBe("/");
    expect(adjusted.pwa).not.toHaveProperty("scope");
    expect(adjusted.pwa).not.toHaveProperty("categories");
    const mobile = project({
      selectedTechnologies: ["expo"],
      pwa: { ...defaultProject.pwa, enabled: true, display: "fullscreen" },
    });
    expect(canonical(mobile).clients.web.pwa).toBeUndefined();
    expect(generateFiles(mobile)["rules/frontend.md"]).not.toContain(
      "Progressive web app",
    );
    const { pwa, ...legacy } = defaultProject;
    void pwa;
    expect(projectSchema.parse(legacy).pwa.enabled).toBe(false);
    expect(
      projectSchema.parse({
        ...defaultProject,
        pwa: { ...defaultProject.pwa, startUrl: "https://example.com" },
      }).pwa.startUrl,
    ).toBe("/");
  });
  it("defaults appearance for projects saved before that step existed", () => {
    const { appearance, selectedProviderOptions, uiStyle, ...legacy } =
      defaultProject;
    void appearance;
    void selectedProviderOptions;
    void uiStyle;
    const parsed = projectSchema.parse(legacy);
    expect(parsed.appearance.themeMode).toBe("light-dark");
    expect(parsed.selectedProviderOptions).toEqual({});
    expect(parsed.uiStyle).toBe("");
  });
  it("writes the selected pipeline into the master prompt", () => {
    expect(automationStages.map((stage) => stage.id)).toEqual([
      ...automationStageIds,
    ]);
    expect(automationStageIds).toContain("canary");
    expect(automationStageIds).toContain("smoke");
    expect(automationStageIds).toContain("sbom");
    expect(generateFiles(defaultProject)["prompts/bootstrap.md"]).not.toContain(
      "## Automation",
    );
    expect(generateFiles(defaultProject)[".github/workflows/ci.yml"]).toContain(
      "pnpm typecheck",
    );
    const { automationStages: omitted, ...legacy } = defaultProject;
    void omitted;
    expect(projectSchema.parse(legacy).automationStages).toEqual([]);
    expect(
      projectSchema.parse({
        ...defaultProject,
        automationStages: ["production", "source", "source"],
      }).automationStages,
    ).toEqual(["source", "production"]);
    const configured = project({
      automationStages: ["production", "source", "test", "security"],
      selectedTechnologies: [
        ...defaultProject.selectedTechnologies,
        "github-actions",
        "kubernetes",
        "argocd",
      ],
    });
    const pack = generateFiles(configured);
    expect(parse(pack["STACK.yaml"]).automation).toEqual({
      tools: ["github-actions", "argocd"],
      stages: ["source", "test", "security", "production"],
    });
    expect(pack["prompts/bootstrap.md"]).toContain("## Automation");
    expect(pack["prompts/bootstrap.md"]).toContain("GitHub Actions");
    expect(pack["prompts/bootstrap.md"]).toContain("Argo CD");
    expect(pack["prompts/bootstrap.md"]).toContain("pnpm test");
    expect(pack["prompts/bootstrap.md"]).toContain("Vercel");
    expect(pack["prompts/bootstrap.md"]).toContain(
      "The pipeline does not run kubectl apply.",
    );
    expect(pack["rules/automation.md"]).toContain("masked pipeline secrets");
    expect(pack[".github/workflows/ci.yml"]).toContain("pnpm test");
    expect(pack[".github/workflows/ci.yml"]).toContain(
      "pnpm audit --audit-level=high",
    );
    expect(pack[".github/workflows/ci.yml"]).not.toContain("pnpm typecheck");
    expect(pack["argocd/application.yaml"]).toContain("kind: Application");
    const gitlab = generateFiles(
      project({
        selectedTechnologies: ["nextjs", "pnpm", "gitlab-ci"],
        automationStages: ["lint", "test"],
      }),
    );
    expect(gitlab[".github/workflows/ci.yml"]).toBeUndefined();
    expect(gitlab[".gitlab-ci.yml"]).toContain("pnpm test");
    expect(gitlab["prompts/bootstrap.md"]).toContain(".gitlab-ci.yml");
    const rewritten = generateFiles({
      ...configured,
      refinedPrompt: "Build the selected product.",
    });
    expect(rewritten["prompts/bootstrap.md"]).toContain(
      "Build the selected product.",
    );
    expect(rewritten["prompts/bootstrap.md"]).toContain("## Automation");
  });
  it("warns when two pipeline hosts or two GitOps controllers are selected", () => {
    expect(
      compatibility(
        project({ selectedTechnologies: ["github-actions", "gitlab-ci"] }),
      ).messages.some((message) => message.message.includes("pipeline hosts")),
    ).toBe(true);
    expect(
      compatibility(
        project({
          selectedTechnologies: ["argocd", "flux", "kubernetes"],
        }),
      ).messages.some((message) => message.message.includes("GitOps")),
    ).toBe(true);
    expect(
      compatibility(
        project({ selectedTechnologies: ["github-actions", "dagger"] }),
      ).messages.some((message) => message.message.includes("pipeline hosts")),
    ).toBe(false);
  });
  it("rejects invalid external configurations", () => {
    expect(
      projectSchema.safeParse({
        ...defaultProject,
        selectedTechnologies: ["invented"],
      }).success,
    ).toBe(false);
    expect(
      projectSchema.safeParse({ ...defaultProject, projectName: "" }).success,
    ).toBe(false);
  });
});
describe("capabilities and boundaries", () => {
  it("refuses insecure contexts", async () => {
    expect((await detectCapabilities({ secure: false })).available).toBe(false);
  });
  it("refuses missing adapters", async () => {
    expect(
      (
        await detectCapabilities({
          secure: true,
          gpu: { requestAdapter: async () => null },
        })
      ).available,
    ).toBe(false);
  });
  it("reports storage availability", async () => {
    const v = await detectCapabilities({
      secure: true,
      gpu: { requestAdapter: async () => ({}) },
      storage: { estimate: async () => ({ quota: 1000, usage: 100 }) },
    });
    expect(v.freeBytes).toBe(900);
  });
  it("handles blocked GPU access", async () => {
    expect(
      (
        await detectCapabilities({
          secure: true,
          gpu: {
            requestAdapter: async () => {
              throw new Error("blocked");
            },
          },
        })
      ).available,
    ).toBe(false);
  });
  it("only permits loopback Ollama endpoints", () => {
    expect(validateOllamaEndpoint("http://localhost:11434")).toBe(
      "http://localhost:11434",
    );
    for (const url of [
      "https://example.com",
      "http://localhost.evil.test",
      "file:///etc/passwd",
      "http://user:pass@localhost",
    ])
      expect(() => validateOllamaEndpoint(url)).toThrow();
  });
  it("enforces body limits on chunked payloads", async () => {
    await expect(
      boundedJson(
        new Request("https://example.com", {
          method: "POST",
          body: "123456789",
        }),
        4,
      ),
    ).rejects.toThrow("too large");
  });
  it("rejects cross-origin mutations", () => {
    expect(
      validOrigin(
        new Request("https://example.com", {
          headers: { origin: "https://evil.test", host: "example.com" },
        }),
      ),
    ).toBe(false);
    expect(
      validOrigin(
        new Request("http://0.0.0.0:3000/api/projects", {
          headers: { origin: "null", host: "localhost:3000" },
        }),
      ),
    ).toBe(false);
  });
  it("accepts the browser host when the server is bound to all interfaces", () => {
    expect(
      validOrigin(
        new Request("http://0.0.0.0:3000/api/projects", {
          headers: {
            origin: "http://localhost:3000",
            host: "localhost:3000",
          },
        }),
      ),
    ).toBe(true);
    expect(
      validOrigin(
        new Request("http://localhost:3000/api/projects", {
          method: "POST",
        }),
      ),
    ).toBe(true);
  });
});
