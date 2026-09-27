import { describe, it, expect } from "vitest";
import { parse } from "yaml";
import { catalogue, byId } from "@/catalogue";
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
});
describe("rules", () => {
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
    ])
      expect(f[name]).toBeTruthy();
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
          headers: { origin: "https://evil.test" },
        }),
      ),
    ).toBe(false);
  });
});
