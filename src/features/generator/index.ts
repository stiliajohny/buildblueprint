import { stringify } from "yaml";
import { byId } from "@/catalogue";
import { projectSchema, type Project } from "@/types/project";
import { compatibility } from "@/features/compatibility";
export function canonical(input: Project) {
  const p = projectSchema.parse(input);
  const selected = p.selectedTechnologies.map((id) => byId[id]);
  const ids = (category: string) =>
    selected.filter((t) => t.category === category).map((t) => t.id);
  return {
    schemaVersion: 1,
    project: {
      name: p.projectName,
      type: p.projectType,
      description: p.projectDescription,
      requirements: p.requirements,
    },
    clients: {
      web: { frameworks: ids("frontend"), language: "typescript" },
      mobile: { enabled: ids("mobile").length > 0, frameworks: ids("mobile") },
      desktop: {
        enabled: ids("desktop").length > 0,
        frameworks: ids("desktop"),
      },
    },
    backend: {
      providers: ids("backend"),
      databases: ids("database"),
      storage: ids("storage"),
      search: ids("search"),
    },
    auth: { providers: ids("auth"), methods: p.selectedAuthMethods },
    ui: { components: ids("ui") },
    libraries: {
      frontend: ids("frontend-library"),
      backend: ids("backend-library"),
    },
    ai: {
      providers: ids("ai"),
      ...(p.selectedTechnologies.includes("browser-ai")
        ? {
            browser: {
              runtime: "transformers-js",
              accelerator: "webgpu",
              requiresDownloadConsent: true,
            },
          }
        : {}),
    },
    payments: { providers: ids("payments") },
    email: { providers: ids("email") },
    analytics: { providers: ids("analytics") },
    monitoring: { providers: ids("monitoring") },
    featureFlags: { providers: ids("feature-flags") },
    deployment: {
      profile: p.deploymentProfile,
      providers: ids("deployment"),
      infrastructure: ids("infrastructure"),
    },
    security: p.security,
    technologies: p.selectedTechnologies,
  };
}
export function slug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "my-project"
  );
}
export function generateFiles(input: Project): Record<string, string> {
  const p = projectSchema.parse(input);
  const c = canonical(p);
  const yaml = stringify(c);
  const selected = c.technologies.map((id) => byId[id]);
  const has = (id: string) => c.technologies.includes(id);
  const names = (ids: string[]) =>
    ids.map((id) => byId[id]?.name ?? id).join(", ") || "Not selected";
  const issues = compatibility(p);
  const stack = selected
    .map((t) => `| ${t.category} | ${t.name} | ${t.website} |`)
    .join("\n");
  const context = `# ${c.project.name}\n\n${c.project.description || "Define the product requirements before implementation."}\n\nProject type: ${c.project.type}. Deployment: ${c.deployment.profile}.\n\n## Requirements\n${c.project.requirements.map((r) => `- ${r}`).join("\n") || "- No additional requirements selected."}\n\n## Stack\n| Capability | Technology | Reference |\n| --- | --- | --- |\n${stack}\n`;
  const architecture = `# Architecture\n\nWeb: ${names(c.clients.web.frameworks)}. Mobile: ${names(c.clients.mobile.frameworks)}. Desktop: ${names(c.clients.desktop.frameworks)}.\n\nBackend: ${names(c.backend.providers)}. Databases: ${names(c.backend.databases)}.\n\nAuthentication: ${names(c.auth.providers)}; methods: ${c.auth.methods.join(", ") || "none"}. Enforce authorization on the server and database, not only in the UI.\n\nHosting: ${names(c.deployment.providers)}. Infrastructure: ${names(c.deployment.infrastructure)}.\n\nKeep UI, domain logic, persistence and external service adapters separate. Validate every external boundary.\n\n## Compatibility review\n${issues.messages.map((m) => `- ${m.severity}: ${m.message} ${m.resolution ?? ""}`).join("\n") || "No conflicts detected by the configured rules. This is not a universal compatibility guarantee."}\n`;
  const security = `# Security rules\n\nSelected controls: ${c.security.join(", ")}.\n\n- Validate external input with ${has("zod") ? "Zod" : "the chosen validation library"}.\n- Never ship service credentials to clients. Separate public configuration from secrets.\n- Authorize every resource access. ${has("supabase") ? "Enable RLS on every exposed Supabase table and test ownership isolation." : ""}\n- Rate-limit authenticated and public mutation endpoints.\n- Configure secure cookies, CSP and origin checks.\n- Verify payment webhook signatures and make handling idempotent.\n- Back up data and test restoration before launch.\n- Apply retention and consent policies to sensitive data and analytics.\n`;
  const testing = `# Testing\n\nUse unit tests for business rules, integration tests for service boundaries, and Playwright for primary browser journeys.\n\nCover authentication, ownership isolation, invalid input, empty states, provider failures, payment webhook replay and persistence.\n\nMock paid APIs and model workers in CI. Never download model weights in automated tests.\n`;
  const frontend = `# Frontend\n\nFrameworks: ${names(c.clients.web.frameworks)}. Components: ${names(c.ui.components)}. Libraries: ${names(c.libraries.frontend)}.\n\nUse accessible semantic controls, explicit loading/error states, responsive layouts and keyboard navigation. Keep data and business rules outside components. ${has("nextjs") ? "Use App Router and Server Components by default; add client boundaries only for interactivity." : ""}\n`;
  const backend = `# Backend\n\nProviders: ${names(c.backend.providers)}. Libraries: ${names(c.libraries.backend)}.\n\nUse server-side service adapters, validate inputs and outputs, time out upstream requests, and do not leak provider errors or secrets. Implement idempotency for writes and retries.\n`;
  const ai = `# AI\n\nProviders: ${names(c.ai.providers)}.\n\n${has("browser-ai") ? "Run Transformers.js in a Web Worker; detect WebGPU and storage, display model size and licence, and require download consent. Never send browser-mode prompts to a server.\n" : ""}${has("ollama") ? "Connect to the user-configured local Ollama endpoint with explicit consent. Restrict the endpoint to loopback and document CORS setup.\n" : ""}Cloud keys stay on the server. Authenticate and rate-limit cloud generation, cap output tokens, and treat model output as untrusted.\n`;
  const prompt = `Implement the project defined below. Read STACK.yaml as the canonical configuration and follow AGENTS.md and rules/*.md. Resolve compatibility issues before coding. Do not silently add alternative providers. Build and test the complete primary user journey.\n\n${context}\n${architecture}\n## Canonical stack\n\n\`\`\`yaml\n${yaml}\`\`\`\n`;
  const files: Record<string, string> = {
    "PROJECT.md": context,
    "ARCHITECTURE.md": architecture,
    "STACK.yaml": yaml,
    "AGENTS.md":
      "# Engineering instructions\n\nRead PROJECT.md, ARCHITECTURE.md and STACK.yaml before implementation. Follow every file in rules/. Use strict types, small service boundaries, and tests for domain logic. Never commit secrets.\n",
    "README.md": `# ${c.project.name} blueprint\n\nThis is an implementation specification pack, not a generated application.\n\n1. Review STACK.yaml and resolve compatibility notes in ARCHITECTURE.md.\n2. Give prompts/bootstrap.md and this folder to your coding agent.\n3. Configure the selected services with .env.example.\n4. Implement and verify the flows in prompts/testing.md.\n\nInfrastructure assets, when included, are starting templates requiring review.\n`,
    "rules/architecture.md": architecture,
    "rules/security.md": security,
    "rules/testing.md": testing,
    "rules/frontend.md": frontend,
    "rules/backend.md": backend,
    "rules/database.md": `# Database\n\nDatabases: ${names(c.backend.databases)}.\n\nVersion migrations, add indexes for observed access patterns, enforce foreign keys and ownership, use least privilege, and exercise backup/restore. Never depend on client-only access restrictions.\n`,
    "rules/ai.md": ai,
    "prompts/bootstrap.md": prompt,
    "prompts/implementation.md": `Read the canonical configuration and architecture, then implement each requirement with acceptance tests.\n\n${context}`,
    "prompts/testing.md": testing,
    "ide/cursor/blueprint.mdc": `---\nalwaysApply: true\n---\nRead AGENTS.md and rules/*.md.\n`,
    "ide/claude/CLAUDE.md": "Read AGENTS.md, STACK.yaml and rules/*.md.\n",
    "ide/codex/AGENTS.md": "Read the root AGENTS.md and all rules/*.md.\n",
    "ide/generic/instructions.md": prompt,
  };
  const env = [
    "# Replace placeholders in your deployment secret store. Never commit real credentials.",
  ];
  if (has("supabase"))
    env.push(
      "NEXT_PUBLIC_SUPABASE_URL=",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=",
    );
  for (const [id, keys] of Object.entries({
    openai: ["OPENAI_API_KEY"],
    deepseek: ["DEEPSEEK_API_KEY"],
    stripe: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    resend: ["RESEND_API_KEY"],
    sentry: ["NEXT_PUBLIC_SENTRY_DSN"],
    r2: ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"],
    postgresql: ["DATABASE_URL"],
    ollama: ["OLLAMA_ENDPOINT"],
  })) {
    if (has(id)) env.push(...keys.map((k) => k + "="));
  }
  files[".env.example"] = env.join("\n") + "\n";
  if (
    has("nextjs") &&
    (has("kubernetes") || c.deployment.profile !== "managed")
  ) {
    files["Dockerfile"] =
      'FROM node:22-alpine AS build\nWORKDIR /app\nRUN corepack enable\nCOPY package.json pnpm-lock.yaml ./\nRUN pnpm install --frozen-lockfile\nCOPY . .\nRUN pnpm build\nFROM node:22-alpine\nWORKDIR /app\nENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000\nCOPY --from=build --chown=node:node /app/.next/standalone ./\nCOPY --from=build --chown=node:node /app/.next/static ./.next/static\nCOPY --from=build --chown=node:node /app/public ./public\nUSER node\nEXPOSE 3000\nCMD ["node", "server.js"]\n';
    files["docker-compose.yml"] =
      'services:\n  app:\n    build: .\n    ports: ["3000:3000"]\n    env_file: .env.local\n    restart: unless-stopped\n';
  }
  if (has("kubernetes"))
    files["kubernetes/deployment.yaml"] = stringify({
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: { name: slug(c.project.name) },
      spec: {
        replicas: 2,
        selector: { matchLabels: { app: slug(c.project.name) } },
        template: {
          metadata: { labels: { app: slug(c.project.name) } },
          spec: {
            containers: [
              {
                name: "app",
                image: "REPLACE_WITH_REGISTRY_IMAGE_AND_DIGEST",
                ports: [{ containerPort: 3000 }],
                resources: {
                  requests: { cpu: "100m", memory: "128Mi" },
                  limits: { cpu: "1", memory: "512Mi" },
                },
                securityContext: {
                  allowPrivilegeEscalation: false,
                  runAsNonRoot: true,
                  capabilities: { drop: ["ALL"] },
                },
                readinessProbe: { httpGet: { path: "/", port: 3000 } },
                livenessProbe: { httpGet: { path: "/", port: 3000 } },
              },
            ],
          },
        },
      },
    });
  if (has("terraform") || has("opentofu"))
    files["terraform/main.tf"] =
      '# Configure remote state and the selected cloud provider before applying.\nterraform {\n  required_version = ">= 1.6"\n}\n';
  if (has("supabase"))
    files["supabase/README.md"] =
      "Use Supabase CLI migrations and test RLS ownership isolation. For self-hosting, use the official versioned Supabase Docker Compose stack: https://supabase.com/docs/guides/self-hosting/docker. Do not treat a lone PostgreSQL container as a full Supabase deployment.\n";
  files[".github/workflows/ci.yml"] =
    "name: CI\non: [push, pull_request]\njobs:\n  verify:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: pnpm/action-setup@v4\n        with:\n          version: 11\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 22\n          cache: pnpm\n      - run: pnpm install --frozen-lockfile\n      - run: pnpm typecheck\n      - run: pnpm test\n      - run: pnpm build\n";
  return files;
}
export async function downloadPack(p: Project) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const folder = zip.folder(slug(p.projectName))!;
  for (const [path, body] of Object.entries(generateFiles(p)))
    folder.file(path, body);
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = slug(p.projectName) + "-blueprint.zip";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
