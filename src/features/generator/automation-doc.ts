import { byId } from "@/catalogue";
import {
  automationStages,
  type AutomationStageId,
} from "@/catalogue/automation";
import { secretPlaceholders } from "@/features/generator/agent-docs";

type Commands = {
  install: string;
  run: (script: string) => string;
  test: string;
  audit: string;
};

/** Shell commands for the selected package manager. */
export function packageCommands(packageManager: string): Commands {
  switch (packageManager) {
    case "npm":
      return {
        install: "npm ci",
        run: (script) => `npm run ${script}`,
        test: "npm test",
        audit: "npm audit --audit-level=high",
      };
    case "yarn":
      return {
        install: "yarn install --immutable",
        run: (script) => `yarn ${script}`,
        test: "yarn test",
        audit: "yarn npm audit --severity high",
      };
    case "bun":
      return {
        install: "bun install --frozen-lockfile",
        run: (script) => (script === "test" ? "bun test" : `bun run ${script}`),
        test: "bun test",
        audit: "bun audit",
      };
    case "deno":
      return {
        install: "deno install",
        run: (script) => `deno task ${script}`,
        test: "deno task test",
        audit: "deno lint",
      };
    default:
      return {
        install: "pnpm install --frozen-lockfile",
        run: (script) => `pnpm ${script}`,
        test: "pnpm test",
        audit: "pnpm audit --audit-level=high",
      };
  }
}

export type AutomationDocInput = {
  name: string;
  stages: readonly AutomationStageId[];
  tools: readonly string[];
  packageManager: string;
  runtime: string;
  deployment: readonly string[];
  databases: readonly string[];
  has: (id: string) => boolean;
  /** True when the stack includes a model that must not be fetched in CI. */
  blockModelDownloads: boolean;
};

const TOOL_GUIDE: Record<string, string> = {
  "github-actions":
    "Write verification to `.github/workflows/ci.yml` and delivery to `.github/workflows/release.yml`. The release workflow runs only on the default branch after verification succeeds. Pin each action to a version. Store secrets in Actions secrets.",
  "gitlab-ci":
    "Write `.gitlab-ci.yml`. Set `stages:` to the selected stages in the order below. Use `rules:` so production does not run on a merge request. Mark production variables protected and masked.",
  teamcity:
    "Describe the same stages as TeamCity build steps in Kotlin DSL under `.teamcity/`. The production build snapshot-depends on the verify build and reuses its artifacts. Store secrets as password parameters.",
  jenkins:
    "Write a declarative `Jenkinsfile` with one `stage` per selected stage, in the order below. Limit production with `when { branch 'main' }` or the repository default branch. Read credentials from the Jenkins credential store.",
  circleci:
    "Write `.circleci/config.yml` with one workflow that runs the selected stages in order. Keep secrets in a CircleCI context.",
  buildkite:
    "Write `.buildkite/pipeline.yml` with one step per selected stage, in order. Agents belong to the team. The pipeline definition stays in the repository, and secrets stay on the cluster.",
  "azure-pipelines":
    "Write `azure-pipelines.yml`. Each selected stage is a pipeline stage that depends on the previous one. Keep secrets in a variable group.",
  "bitbucket-pipelines":
    "Write `bitbucket-pipelines.yml`. Run verification on pull requests. Use a deployment environment for staging and production.",
  woodpecker:
    "Write `.woodpecker/workflow.yml` with the selected stages in order. Woodpecker runs on infrastructure the team operates. Repository secrets stay on that server.",
  drone:
    "Write `.drone.yml` with one step per selected stage, in order. Drone runs each step in a container. Keep secrets in the Drone secret store, not in the YAML.",
  earthly:
    "Express the selected stages in an `Earthfile` and call those targets from the pipeline host. Earthly is the source of truth so the same stages can run locally.",
  "cloud-build":
    "Write `cloudbuild.yaml` with one step per selected stage. Read secrets from Secret Manager. A Cloud Build trigger watches this repository.",
  codepipeline:
    "AWS CodePipeline orchestrates the stages. `buildspec.yml` covers checkout through build. Later stages are CodePipeline actions for the selected host. Read secrets from AWS Secrets Manager. Do not put keys in the buildspec.",
  tekton:
    "Write a Tekton Pipeline and Tasks under `tekton/`. Each selected stage is a Task in the order below. The pipeline runs on the cluster. Do not bake keys into a task image.",
  dagger:
    "Express the selected stages as Dagger functions and call those functions from the pipeline host. The functions are the source of truth so the same stages can run locally.",
  argocd:
    "Add `argocd/application.yaml` for this repository. Argo CD syncs the desired state from Git. The pipeline updates the image tag in Git and does not apply manifests itself. Leave prune off until the application owns every resource in its namespace.",
  flux: "Add a Flux GitRepository and Kustomization for this repository. The pipeline updates the image tag in Git. Flux applies that change. Do not run kubectl apply from the pipeline.",
  "argo-rollouts":
    "Use an Argo Rollout for production on Kubernetes. Shift traffic in steps, and abort returns traffic to the previous ReplicaSet. Prefer this for the Canary stage when selected.",
  spinnaker:
    "The pipeline publishes an immutable artifact. Spinnaker promotes that artifact through staging, approval, and production. Do not also deploy those stages from the CI host.",
  octopus:
    "The pipeline publishes one versioned package. Octopus Deploy promotes that same package through staging, approval, and production. Do not rebuild it during promotion.",
  harness:
    "Define a Harness pipeline that promotes the same artifact through the selected stages. Keep approvals and rollbacks in Harness. Do not rebuild the artifact during promotion.",
};

function names(ids: readonly string[]) {
  return ids.map((id) => byId[id]?.name ?? id).join(", ");
}

function stageLine(
  id: AutomationStageId,
  input: AutomationDocInput,
  cmd: Commands,
) {
  const database = names(input.databases);
  const hosts = names(input.deployment);
  switch (id) {
    case "source":
      return "Trigger on push to the default branch, on pull requests, and on version tags. Check out that commit. Do not build from uncommitted files.";
    case "setup":
      return `Install ${input.runtime} and ${input.packageManager}. Cache the lockfile. Install with \`${cmd.install}\`. Fail when the lockfile is out of date.`;
    case "lint":
      return `Run \`${cmd.run("lint")}\` when that script exists. Fail the pipeline on a lint error. Do not commit formatting changes from the pipeline.`;
    case "typecheck":
      return `Run \`${cmd.run("typecheck")}\`. Fail on a type error. Do not skip this because the tests passed.`;
    case "test":
      return `Run \`${cmd.test}\`. Fail when a test fails. Mock paid APIs and model workers. Do not download model weights.`;
    case "coverage":
      return "Publish a coverage report from the unit suite and fail when the configured threshold is not met. Do not lower the threshold to make the pipeline green.";
    case "integration":
      return database
        ? `Run integration tests for ${database} and the other selected adapters against disposable local services. Do not point them at production. Tear the services down when the job ends.`
        : "Run integration tests against disposable local services for the selected adapters. Do not point them at production.";
    case "contract":
      return "Verify published API and event contracts against the schemas in this repository. Fail when a consumer or provider breaks a contract. Do not hit production endpoints.";
    case "security":
      return `Run \`${cmd.audit}\` and a secret scan of the commit. Fail on a known critical advisory or a committed secret. Do not print secret values.`;
    case "sbom":
      return "Generate a Software Bill of Materials for the build and attach it to the artifact. Prefer SPDX or CycloneDX. Fail when a critical known vulnerability is present in a direct dependency.";
    case "build":
      return `Run \`${cmd.run("build")}\`. Save the output as a pipeline artifact. Later stages deploy that artifact.`;
    case "image":
      return input.has("kubernetes") || input.deployment.length > 0
        ? "When the project has a Dockerfile, build an image from the same commit, tag it with the commit sha, and push it to the registry the selected host uses. Do not deploy a floating latest tag as the only reference."
        : "Build an image only when the project ships a Dockerfile. Tag it with the commit sha.";
    case "a11y":
      return "Run automated accessibility checks against the built UI. Fail on critical or serious violations. Manual review still belongs outside this stage.";
    case "e2e":
      return "Run the Playwright journeys from prompts/testing.md against the built artifact. Install browsers only in this job. Fail the pipeline when a primary journey fails.";
    case "performance":
      return "Measure load time against documented budgets for the primary routes. Fail when LCP, TTI, or the agreed load budget is exceeded. Do not use production user data.";
    case "preview":
      return "Deploy this commit to an ephemeral environment and record its URL. Destroy that environment when the change is closed. Do not copy production data into it.";
    case "migrate":
      return database
        ? `Apply the versioned migrations for ${database} before the new version receives traffic. Stop the pipeline when a migration fails. A pull request must not migrate production.`
        : "Migrate is selected and no database is selected. Omit this job until a database is part of the stack.";
    case "staging":
      return `Deploy the same artifact to a production-like environment${hosts ? ` for ${hosts}` : ""}. Run a smoke check there before production. Staging uses its own credentials.`;
    case "smoke":
      return "After staging or production deploy, hit health endpoints and one critical user path. Fail the pipeline when any check fails. Keep credentials out of the log.";
    case "approve":
      return "Require one human approval before production. Record who approved. A pull request build cannot approve itself into production.";
    case "canary":
      return input.has("argo-rollouts")
        ? "Roll out to a small share of production traffic with Argo Rollouts. Abort and return traffic to the previous ReplicaSet when the smoke checks fail."
        : "Roll out to a small share of production traffic before the full Production stage. Abort and restore the previous artifact when the smoke checks fail.";
    case "production":
      return hosts
        ? `Deploy the approved artifact to ${hosts}. Production runs only from the default branch after every earlier selected stage has passed.`
        : "Production is selected and no hosting provider is selected. Publish the artifact and stop. Do not invent a host.";
    case "release":
      return "When the product publishes a package, image, or store build, cut that release from the same commit. Write the changelog from the commits since the previous tag. Do not republish an existing version.";
    case "notify":
      return "Report success and failure to the team channel configured outside the repository. Include the stage, commit, and a link to the log. Do not include secret values.";
    case "rollback":
      return "Keep the previous production artifact. Document one command, or one Git revert, that restores it. A failed production deploy must leave that previous artifact in place.";
    case "cleanup":
      return "Delete expired preview environments, unused pipeline caches, and orphaned images for this commit once they are no longer needed. Do not delete production artifacts.";
  }
}

function deployLines(input: AutomationDocInput) {
  const lines: string[] = [];
  if (input.has("vercel"))
    lines.push(
      "Vercel hosts the web app. The Preview stage is a Vercel preview deployment. The Production stage deploys the default branch to the Vercel production environment.",
    );
  if (input.has("cloudflare"))
    lines.push(
      "Cloudflare is a selected edge host. Deploy with its official CLI or Git integration. Keep the API token in the pipeline secret store.",
    );
  if (input.has("netlify"))
    lines.push(
      "Netlify deploys this repository. Preview and production follow Netlify's environments.",
    );
  if (input.has("render"))
    lines.push(
      "Render deploys the service from this repository. Use Render's deploy for the Production stage.",
    );
  if (input.has("railway"))
    lines.push(
      "Railway deploys the service from this repository. Use Railway's deploy for the Production stage.",
    );
  if (input.has("fly"))
    lines.push(
      "Fly.io deploys with flyctl. The Production stage runs that deploy with a token from the secret store.",
    );
  if (input.has("aws") || input.has("gcp") || input.has("azure"))
    lines.push(
      `Cloud hosting includes ${names(input.deployment.filter((id) => ["aws", "gcp", "azure"].includes(id)))}. Target the account named for this project. Do not create a second account from the pipeline.`,
    );
  if (input.has("kubernetes")) {
    if (input.has("argocd") || input.has("flux"))
      lines.push(
        "Kubernetes receives the image tag from Git. The selected GitOps controller rolls it out. The pipeline does not run kubectl apply.",
      );
    else
      lines.push(
        "Kubernetes manifests live with the project. The Production stage applies those manifests and uses the image digest from the Image stage.",
      );
  }
  const named = input.deployment.filter(
    (id) =>
      ![
        "vercel",
        "cloudflare",
        "netlify",
        "render",
        "railway",
        "fly",
        "aws",
        "gcp",
        "azure",
        "kubernetes",
      ].includes(id),
  );
  if (named.length)
    lines.push(
      `Also deploy with ${names(named)}, using that host's official CLI or Git integration.`,
    );
  if (!lines.length)
    lines.push(
      "No hosting provider is selected. Stop after the build artifact. Do not invent a deploy target.",
    );
  return lines;
}

/** Instructions an agent uses to build the selected pipeline. */
export function automationDoc(input: AutomationDocInput) {
  if (!input.stages.length && !input.tools.length) return "";
  const cmd = packageCommands(input.packageManager);
  const hosts = input.tools.filter((id) => byId[id]?.category === "ci");
  const delivery = input.tools.filter((id) => byId[id]?.category === "cd");
  const lines = [
    "## Automation",
    "",
    `Build the delivery pipeline for ${input.name}. Follow STACK.yaml. Add a stage or a tool only when this section names it.`,
    "",
  ];
  if (!input.stages.length) {
    lines.push(
      "No stages are selected. Add a verification workflow that installs dependencies, then runs typecheck, test, and build. Do not add preview, deploy, or release jobs.",
      "",
    );
  } else {
    lines.push(
      "Run these stages in this order. A failed stage stops every stage after it. Pull requests may run verification and preview. They must not run production.",
      "",
    );
    input.stages.forEach((id, index) => {
      const stage = automationStages.find((item) => item.id === id);
      lines.push(
        `${index + 1}. ${stage?.label ?? id}. ${stageLine(id, input, cmd)}`,
      );
    });
    lines.push("");
  }
  lines.push("### Tools", "");
  if (!input.tools.length) {
    lines.push(
      "No pipeline host is selected. Implement the stages with GitHub Actions, in `.github/workflows/`.",
      "",
    );
  } else {
    for (const id of input.tools) {
      const guide = TOOL_GUIDE[id];
      if (guide) lines.push(`- ${byId[id]?.name ?? id}. ${guide}`);
    }
    lines.push("");
  }
  const gitops = input.has("argocd") || input.has("flux");
  const ciHost = hosts.filter((id) => id !== "dagger");
  if (gitops && ciHost.length) {
    lines.push(
      "The CI host publishes the artifact and updates Git. The delivery controller performs the cluster rollout.",
      "",
    );
  }
  if (delivery.length && !gitops && ciHost.length) {
    lines.push(
      "The CI host publishes one immutable artifact. The delivery tool promotes that artifact. Do not rebuild it in a later environment.",
      "",
    );
  }
  lines.push("### Deploy target", "");
  for (const line of deployLines(input)) lines.push(line);
  lines.push("");
  const secrets = secretPlaceholders(input.has);
  lines.push("### Secrets", "");
  lines.push(
    secrets.length
      ? `Configure these names as masked pipeline secrets: ${secrets.join(", ")}. Never echo them and never commit the values.`
      : "No service credentials are selected. Do not add secret variables that STACK.yaml does not require.",
  );
  if (input.blockModelDownloads)
    lines.push("Do not download model weights in this pipeline.");
  lines.push(
    "Pin actions, container images, and CLIs to a version. The production deploy consumes the artifact from Build.",
  );
  return lines.join("\n").trim() + "\n";
}

/** One-line architecture summary for the selected pipeline. */
export function automationSummary(input: AutomationDocInput) {
  if (!input.stages.length && !input.tools.length) return "";
  const toolLabel = input.tools.length
    ? names([...input.tools])
    : "GitHub Actions";
  const stageLabel = input.stages.length
    ? input.stages
        .map(
          (id) =>
            automationStages.find((stage) => stage.id === id)?.label ?? id,
        )
        .join(", ")
    : "typecheck, test, and build only";
  return `Automation: ${toolLabel}. Stages: ${stageLabel}.`;
}

const VERIFY = ["lint", "typecheck", "test", "security", "build"] as const;

/** GitLab CI file for the stages that have a repository command. */
export function gitlabCi(input: AutomationDocInput) {
  const cmd = packageCommands(input.packageManager);
  const wanted = (
    input.stages.length ? input.stages : ["typecheck", "test", "build"]
  ).filter((id): id is (typeof VERIFY)[number] =>
    (VERIFY as readonly string[]).includes(id),
  );
  if (!wanted.length) return "";
  const image =
    input.packageManager === "bun"
      ? "oven/bun:1"
      : input.packageManager === "deno"
        ? "denoland/deno:alpine"
        : "node:22";
  const before =
    input.packageManager === "npm" || input.packageManager === "bun"
      ? cmd.install
      : input.packageManager === "deno"
        ? ""
        : `corepack enable\n    - ${cmd.install}`;
  const scriptFor = (id: (typeof VERIFY)[number]) => {
    if (id === "security") return cmd.audit;
    if (id === "test") return cmd.test;
    return cmd.run(id);
  };
  const jobs = wanted
    .map((id) => `${id}:\n  stage: ${id}\n  script:\n    - ${scriptFor(id)}\n`)
    .join("\n");
  const beforeBlock = before ? `  before_script:\n    - ${before}\n` : "";
  return `stages:\n${wanted.map((id) => `  - ${id}`).join("\n")}\n\ndefault:\n  image: ${image}\n${beforeBlock}\n${jobs}`;
}

/** Starting GitOps manifests when a controller and Kubernetes are both selected. */
export function gitopsFiles(input: AutomationDocInput, appSlug: string) {
  const files: Record<string, string> = {};
  if (!input.has("kubernetes")) return files;
  const name = appSlug;
  if (input.has("argocd"))
    files["argocd/application.yaml"] = `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ${name}
  namespace: argocd
spec:
  project: default
  source:
    repoURL: REPLACE_WITH_GIT_REMOTE
    targetRevision: HEAD
    path: kubernetes
  destination:
    server: https://kubernetes.default.svc
    namespace: ${name}
  syncPolicy:
    automated:
      prune: false
      selfHeal: true
`;
  if (input.has("flux"))
    files["flux/kustomization.yaml"] = `apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: ${name}
  namespace: flux-system
spec:
  interval: 5m
  url: REPLACE_WITH_GIT_REMOTE
  ref:
    branch: main
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: ${name}
  namespace: flux-system
spec:
  interval: 5m
  sourceRef:
    kind: GitRepository
    name: ${name}
  path: ./kubernetes
  prune: false
`;
  return files;
}
