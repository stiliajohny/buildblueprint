import { stringify } from "yaml";
import { byId } from "@/catalogue";
import { projectSchema, type Project } from "@/types/project";
import { compatibility } from "@/features/compatibility";
import { agentDocs, secretPlaceholders } from "@/features/generator/agent-docs";
import {
  automationDoc,
  automationSummary,
  gitlabCi,
  gitopsFiles,
  packageCommands,
  type AutomationDocInput,
} from "@/features/generator/automation-doc";
import type { AutomationStageId } from "@/catalogue/automation";
import { colorSchemes } from "@/catalogue/color-schemes";
import {
  homeScreenName,
  pwaDisplays,
  pwaInstalls,
  pwaOfflineModes,
  pwaOrientations,
  pwaUpdates,
} from "@/catalogue/pwa";
import { uiStyles } from "@/catalogue/ui-styles";
import {
  resolvedAiOptions,
  resolvedAuthMethods,
  securityControlsFor,
} from "@/catalogue/provider-options";

/** Map a selected package manager to the runtime that executes it. */
export function javascriptToolchain(ids: string[]) {
  const id =
    ["npm", "pnpm", "yarn", "bun", "deno"].find((manager) =>
      ids.includes(manager),
    ) ?? "pnpm";
  const runtime = id === "bun" || id === "deno" ? id : "node";
  return { runtime, packageManager: id };
}

/** GitHub Actions workflow for the selected package manager and stages. */
function ciWorkflow(packageManager: string, stages: readonly string[] = []) {
  const head =
    "name: CI\non: [push, pull_request]\njobs:\n  verify:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n";
  const audit = packageCommands(packageManager).audit;
  const scripts = (run: (script: string) => string) => {
    const ids = stages.length
      ? ["lint", "typecheck", "test", "build"].filter((id) =>
          stages.includes(id),
        )
      : ["typecheck", "test", "build"];
    const commands = ids.flatMap((script) =>
      script === "build" && stages.includes("security")
        ? [audit, run(script)]
        : [run(script)],
    );
    if (stages.includes("security") && !ids.includes("build"))
      commands.push(audit);
    return commands.map((command) => `      - run: ${command}\n`).join("");
  };
  switch (packageManager) {
    case "npm":
      return (
        head +
        "      - uses: actions/setup-node@v4\n        with:\n          node-version: 22\n          cache: npm\n      - run: npm ci\n" +
        scripts((script) => `npm run ${script}`)
      );
    case "yarn":
      return (
        head +
        "      - uses: actions/setup-node@v4\n        with:\n          node-version: 22\n          cache: yarn\n      - run: corepack enable\n      - run: yarn install --immutable\n" +
        scripts((script) => `yarn ${script}`)
      );
    case "bun":
      return (
        head +
        "      - uses: oven-sh/setup-bun@v2\n        with:\n          bun-version: 1\n      - run: bun install --frozen-lockfile\n" +
        scripts((script) =>
          script === "test" ? "bun test" : `bun run ${script}`,
        )
      );
    case "deno":
      return (
        head +
        "      - uses: denoland/setup-deno@v2\n        with:\n          deno-version: v2.x\n" +
        scripts((script) => `deno task ${script}`)
      );
    default:
      return (
        head +
        "      - uses: pnpm/action-setup@v4\n        with:\n          version: 11\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 22\n          cache: pnpm\n      - run: pnpm install --frozen-lockfile\n" +
        scripts((script) => `pnpm ${script}`)
      );
  }
}

/** Next.js container build that installs with the selected package manager. */
function dockerfile(packageManager: string) {
  const serve =
    'FROM node:22-alpine\nWORKDIR /app\nENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000\nCOPY --from=build --chown=node:node /app/.next/standalone ./\nCOPY --from=build --chown=node:node /app/.next/static ./.next/static\nCOPY --from=build --chown=node:node /app/public ./public\nUSER node\nEXPOSE 3000\nCMD ["node", "server.js"]\n';
  const build: Record<string, string> = {
    npm: "FROM node:22-alpine AS build\nWORKDIR /app\nCOPY package.json package-lock.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n",
    yarn: "FROM node:22-alpine AS build\nWORKDIR /app\nRUN corepack enable\nCOPY package.json yarn.lock ./\nRUN yarn install --immutable\nCOPY . .\nRUN yarn build\n",
    bun: "FROM oven/bun:1-alpine AS build\nWORKDIR /app\nCOPY package.json bun.lock ./\nRUN bun install --frozen-lockfile\nCOPY . .\nRUN bun run build\n",
    deno: "FROM denoland/deno:alpine AS build\nWORKDIR /app\nCOPY . .\nRUN deno task build\n",
    pnpm: "FROM node:22-alpine AS build\nWORKDIR /app\nRUN corepack enable\nCOPY package.json pnpm-lock.yaml ./\nRUN pnpm install --frozen-lockfile\nCOPY . .\nRUN pnpm build\n",
  };
  return (build[packageManager] ?? build.pnpm) + serve;
}

export function canonical(input: Project) {
  const p = projectSchema.parse(input);
  const scheme = colorSchemes.find(
    (item) => item.id === p.appearance.colorScheme,
  );
  const uiStyle = uiStyles.find((item) => item.id === p.uiStyle);
  const selected = p.selectedTechnologies.map((id) => byId[id]);
  const ids = (category: string) =>
    selected.filter((t) => t.category === category).map((t) => t.id);
  const webFrameworks = ids("frontend");
  const shortName = homeScreenName(p.pwa.shortName, p.projectName);
  return {
    schemaVersion: 1,
    project: {
      name: p.projectName,
      type: p.projectType,
      description: p.projectDescription,
      requirements: p.requirements,
    },
    toolchain: { javascript: javascriptToolchain(p.selectedTechnologies) },
    clients: {
      web: {
        frameworks: webFrameworks,
        language: "typescript",
        ...(webFrameworks.length > 0 && p.pwa.enabled
          ? {
              pwa: {
                shortName,
                display: p.pwa.display,
                orientation: p.pwa.orientation,
                startUrl: p.pwa.startUrl,
                scope: "/",
                offline: p.pwa.offline,
                updates: p.pwa.updates,
                install: p.pwa.install,
                maskableIcons: p.pwa.maskableIcons,
                themeFromPalette: p.pwa.themeFromPalette,
                shareTarget: p.pwa.shareTarget,
              },
            }
          : {}),
      },
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
    auth: {
      providers: ids("auth"),
      methods: resolvedAuthMethods(
        p.selectedTechnologies,
        p.selectedAuthMethods,
        p.selectedProviderOptions,
      ),
    },
    ui: {
      components: ids("ui"),
      theme:
        p.appearance.themeMode === "single"
          ? { mode: "single" as const, theme: p.appearance.singleTheme }
          : { mode: p.appearance.themeMode },
      ...(scheme
        ? {
            colorScheme: scheme.id,
            palette: { light: scheme.light, dark: scheme.dark },
          }
        : {}),
      ...(uiStyle ? { style: uiStyle.id } : {}),
    },
    libraries: {
      frontend: ids("frontend-library"),
      backend: ids("backend-library"),
    },
    ai: {
      providers: ids("ai"),
      options: Object.fromEntries(
        ids("ai").map((id) => [
          id,
          resolvedAiOptions(id, p.selectedProviderOptions[id]),
        ]),
      ),
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
    ...(p.automationStages.length ||
    ids("ci").length ||
    ids("cd").length
      ? {
          automation: {
            tools: [...ids("ci"), ...ids("cd")],
            stages: p.automationStages,
          },
        }
      : {}),
    security: p.security.filter((id) =>
      securityControlsFor(p.selectedTechnologies).some(
        (control) => control.id === id,
      ),
    ),
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
function choiceGuidance<Id extends string>(
  options: readonly { id: Id; guidance: string }[],
  id: Id,
) {
  return options.find((item) => item.id === id)?.guidance ?? "";
}

/** Manifest and service-worker rules for an enabled web app. */
function pwaRules(
  pwa: NonNullable<ReturnType<typeof canonical>["clients"]["web"]["pwa"]>,
) {
  const lines = [
    "## Progressive web app",
    "",
    `Serve the app over HTTPS. short_name is "${pwa.shortName}". start_url is ${pwa.startUrl}. scope is ${pwa.scope}. Set the manifest id to the start URL and keep that id stable.`,
    choiceGuidance(pwaDisplays, pwa.display),
    choiceGuidance(pwaOrientations, pwa.orientation),
    pwa.maskableIcons
      ? "Include PNG icons at 192px and 512px with purpose any, plus a 512px maskable icon with padding inside the safe zone."
      : "Include PNG icons at 192px and 512px with purpose any.",
    pwa.themeFromPalette
      ? "Set theme_color and background_color from the selected palette. When light and dark both ship, put the light pair in the manifest and use a theme-color meta tag for the active theme."
      : "Leave theme_color and background_color unset.",
    choiceGuidance(pwaOfflineModes, pwa.offline),
    choiceGuidance(pwaUpdates, pwa.updates),
    choiceGuidance(pwaInstalls, pwa.install),
    pwa.shareTarget
      ? "Add a share_target for title, text, and url on the start URL. This works for an installed Chromium app. Treat the shared values as untrusted."
      : "Do not add a share target.",
  ];
  return lines.filter(Boolean).join("\n") + "\n\n";
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
  const js = c.toolchain.javascript;
  const pwaNote = c.clients.web.pwa
    ? ` Progressive web app: ${c.clients.web.pwa.display}, start ${c.clients.web.pwa.startUrl}.`
    : "";
  const automationInput: AutomationDocInput = {
    name: c.project.name,
    stages: p.automationStages as AutomationStageId[],
    tools: c.automation?.tools ?? [],
    packageManager: js.packageManager,
    runtime: js.runtime,
    deployment: c.deployment.providers,
    databases: c.backend.databases,
    has,
    blockModelDownloads: c.ai.providers.length > 0 || has("browser-ai"),
  };
  const automationSection = automationDoc(automationInput);
  const automationLine = automationSummary(automationInput);
  const architecture = `# Architecture\n\nWeb: ${names(c.clients.web.frameworks)}.${pwaNote} Mobile: ${names(c.clients.mobile.frameworks)}. Desktop: ${names(c.clients.desktop.frameworks)}.\n\nJavaScript: ${js.packageManager} on ${js.runtime}.\n\nBackend: ${names(c.backend.providers)}. Databases: ${names(c.backend.databases)}.\n\nAuthentication: ${names(c.auth.providers)}; methods: ${c.auth.methods.join(", ") || "none"}. Enforce authorization on the server and database, not only in the UI.\n\nHosting: ${names(c.deployment.providers)}. Infrastructure: ${names(c.deployment.infrastructure)}.${automationLine ? `\n\n${automationLine}` : ""}\n\nKeep UI, domain logic, persistence and external service adapters separate. Validate every external boundary.\n\n## Compatibility review\n${issues.messages.map((m) => `- ${m.severity}: ${m.message} ${m.resolution ?? ""}`).join("\n") || "No conflicts detected by the configured rules. This is not a universal compatibility guarantee."}\n`;
  const security = `# Security rules\n\nSelected controls: ${c.security.join(", ")}.\n\n- Validate external input with ${has("zod") ? "Zod" : "the chosen validation library"}.\n- Never ship service credentials to clients. Separate public configuration from secrets.\n- Authorize every resource access. ${has("supabase") ? "Enable RLS on every exposed Supabase table and test ownership isolation." : ""}\n- Rate-limit authenticated and public mutation endpoints.\n- Configure secure cookies, CSP and origin checks.\n- Verify payment webhook signatures and make handling idempotent.\n- Back up data and test restoration before launch.\n- Apply retention and consent policies to sensitive data and analytics.\n`;
  const testing = `# Testing\n\nUse unit tests for business rules, integration tests for service boundaries, and Playwright for primary browser journeys.\n\nCover authentication, ownership isolation, invalid input, empty states, provider failures, payment webhook replay and persistence.\n\nMock paid APIs and model workers in CI. Never download model weights in automated tests.\n`;
  const theme =
    c.ui.theme.mode === "single"
      ? `Use a single ${c.ui.theme.theme} theme.`
      : c.ui.theme.mode === "light-dark"
        ? "Support light and dark themes."
        : "Support light, dark, and system themes.";
  const scheme = colorSchemes.find((item) => item.id === c.ui.colorScheme);
  const uiStyle = uiStyles.find((item) => item.id === c.ui.style);
  const schemeLabel = scheme
    ? `${scheme.name} and ${scheme.description}. Use ui.palette.light and ui.palette.dark. A single theme still keeps the other mode as the equivalent.`
    : c.ui.colorScheme;
  const styleSection = uiStyle
    ? `## UI style\n\n${uiStyle.name}. ${uiStyle.guidance}\n\nUse this high-level CSS. Map the colours to the selected palette; do not treat these sample colours as the product theme.\n\n\`\`\`css\n${uiStyle.css}\n\`\`\`\n`
    : "";
  const pwaSection = c.clients.web.pwa ? pwaRules(c.clients.web.pwa) : "";
  const frontend = `# Frontend\n\nFrameworks: ${names(c.clients.web.frameworks)}. Components: ${names(c.ui.components)}. Libraries: ${names(c.libraries.frontend)}.\n\n${theme}${schemeLabel ? ` Colour scheme: ${schemeLabel}.` : ""}\n\n${styleSection}${pwaSection}Install dependencies and run scripts with ${js.packageManager} on the ${js.runtime} runtime.\n\nUse accessible semantic controls, explicit loading/error states, responsive layouts and keyboard navigation. Keep data and business rules outside components. ${has("nextjs") ? "Use App Router and Server Components by default; add client boundaries only for interactivity." : ""}\n`;
  const backend = `# Backend\n\nProviders: ${names(c.backend.providers)}. Libraries: ${names(c.libraries.backend)}.\n\nUse server-side service adapters, validate inputs and outputs, time out upstream requests, and do not leak provider errors or secrets. Implement idempotency for writes and retries.\n`;
  const aiChoices = Object.entries(c.ai.options)
    .filter(([, options]) => options.length > 0)
    .map(([id, options]) => `${byId[id]?.name ?? id}: ${options.join(", ")}`)
    .join(". ");
  const ai = `# AI\n\nProviders: ${names(c.ai.providers)}.${aiChoices ? ` Selected capabilities: ${aiChoices}.` : ""}\n\n${has("browser-ai") ? "Run Transformers.js in a Web Worker; detect WebGPU and storage, display model size and licence, and require download consent. Never send browser-mode prompts to a server.\n" : ""}${has("ollama") ? "Connect to the user-configured local Ollama endpoint with explicit consent. Restrict the endpoint to loopback and document CORS setup.\n" : ""}Cloud keys stay on the server. Authenticate and rate-limit cloud generation, cap output tokens, and treat model output as untrusted.\n`;
  const generatedPrompt = `Implement the project defined below. Read STACK.yaml as the canonical configuration and follow AGENTS.md, docs/*.md, and rules/*.md. Resolve compatibility issues before coding. Do not silently add alternative providers. Build and test the complete primary user journey.\n\n${context}\n${architecture}\n## Canonical stack\n\n\`\`\`yaml\n${yaml}\`\`\`\n`;
  const promptBody = p.refinedPrompt.trim() || generatedPrompt;
  const prompt = `${promptBody}${styleSection ? `\n${styleSection}` : ""}${automationSection ? `\n${automationSection}` : ""}`;
  const files: Record<string, string> = {
    "PROJECT.md": context,
    "ARCHITECTURE.md": architecture,
    "STACK.yaml": yaml,
    "AGENTS.md":
      "# Engineering instructions\n\nRead PROJECT.md, ARCHITECTURE.md, and STACK.yaml before implementation.\n\nBefore changing security, data, or HTTP behavior, read docs/SECURITY.md, docs/CODE_STYLE.md, docs/DATABASE.md, docs/API.md, docs/THREAT_MODEL.md, docs/SECURITY_ARCHITECTURE.md, and docs/SECURITY_CHECKLIST.md.\n\nFollow every file in rules/. Use strict types, small service boundaries, and tests for domain logic. Never commit secrets. If a doc disagrees with STACK.yaml, follow STACK.yaml and update the doc.\n",
    "README.md": `# ${c.project.name} blueprint\n\nThis is an implementation specification pack, not a generated application.\n\n1. Review STACK.yaml and resolve compatibility notes in ARCHITECTURE.md.\n2. Give this folder to your coding agent, including docs/ and prompts/bootstrap.md.\n3. Configure the selected services with .env.example.\n4. Implement and verify the flows in prompts/testing.md.\n\nInfrastructure assets, when included, are starting templates requiring review.\n`,
    "rules/architecture.md": architecture,
    "rules/security.md":
      "The requirements, threat model, architecture, and launch checklist are in docs/.\n\n" +
      security,
    "rules/testing.md": testing,
    "rules/frontend.md": frontend,
    "rules/backend.md": backend,
    "rules/database.md": `# Database\n\nSee docs/DATABASE.md for ownership, migrations, and what not to invent.\n\nDatabases: ${names(c.backend.databases)}.\n\nVersion migrations, add indexes for observed access patterns, enforce foreign keys and ownership, use least privilege, and exercise backup/restore. Never depend on client-only access restrictions.\n`,
    "rules/ai.md": ai,
    "prompts/bootstrap.md": prompt,
    "prompts/implementation.md": `Read the canonical configuration and architecture, then implement each requirement with acceptance tests.\n\n${context}`,
    "prompts/testing.md": testing,
    "ide/cursor/blueprint.mdc": `---\nalwaysApply: true\n---\nRead AGENTS.md, docs/*.md, and rules/*.md.\n`,
    "ide/claude/CLAUDE.md":
      "Read AGENTS.md, STACK.yaml, docs/*.md, and rules/*.md.\n",
    "ide/codex/AGENTS.md":
      "Read the root AGENTS.md, docs/*.md, and all rules/*.md.\n",
    "ide/generic/instructions.md": prompt,
  };
  const env = [
    "# Replace placeholders in your deployment secret store. Never commit real credentials.",
    ...secretPlaceholders(has).map((key) => key + "="),
  ];
  files[".env.example"] = env.join("\n") + "\n";
  Object.assign(
    files,
    agentDocs({
      name: c.project.name,
      has,
      authProviders: c.auth.providers,
      authMethods: c.auth.methods,
      databases: c.backend.databases,
      web: c.clients.web.frameworks,
      ui: c.ui.components,
      frontendLibraries: c.libraries.frontend,
      ai: c.ai.providers,
      payments: c.payments.providers,
      storage: c.backend.storage,
      email: c.email.providers,
      deployment: c.deployment.providers,
      security: c.security,
      packageManager: js.packageManager,
    }),
  );
  if (
    has("nextjs") &&
    (has("kubernetes") || c.deployment.profile !== "managed")
  ) {
    files["Dockerfile"] = dockerfile(js.packageManager);
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
  if (automationSection) files["rules/automation.md"] = automationSection;
  const ciSelected = c.technologies.filter((id) => byId[id]?.category === "ci");
  if (ciSelected.includes("github-actions") || ciSelected.length === 0)
    files[".github/workflows/ci.yml"] = ciWorkflow(
      js.packageManager,
      p.automationStages,
    );
  if (has("gitlab-ci")) {
    const gitlab = gitlabCi(automationInput);
    if (gitlab) files[".gitlab-ci.yml"] = gitlab;
  }
  Object.assign(files, gitopsFiles(automationInput, slug(c.project.name)));
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
