/** Generic delivery stages. Every automation tool runs this same sequence. */
export const automationStages = [
  {
    id: "source",
    label: "Checkout",
    summary: "Fetch the exact commit the rest of the pipeline builds.",
  },
  {
    id: "setup",
    label: "Setup",
    summary: "Install the toolchain and cache dependencies from the lockfile.",
  },
  {
    id: "lint",
    label: "Lint",
    summary: "Fail when formatting or static analysis fails.",
  },
  {
    id: "typecheck",
    label: "Types",
    summary: "Fail on a type error before tests run.",
  },
  {
    id: "test",
    label: "Unit tests",
    summary: "Run the fast test suite and mock paid APIs.",
  },
  {
    id: "coverage",
    label: "Coverage",
    summary: "Enforce a minimum coverage threshold on the unit suite.",
  },
  {
    id: "integration",
    label: "Integration",
    summary: "Exercise service boundaries against disposable local services.",
  },
  {
    id: "contract",
    label: "Contract",
    summary: "Verify API and event contracts against published schemas.",
  },
  {
    id: "security",
    label: "Security",
    summary: "Audit dependencies and scan the commit for secrets.",
  },
  {
    id: "sbom",
    label: "Supply chain",
    summary: "Produce an SBOM and attest the build inputs.",
  },
  {
    id: "build",
    label: "Build",
    summary: "Produce the artifact that later stages deploy.",
  },
  {
    id: "image",
    label: "Image",
    summary: "Build a container image and tag it with the commit.",
  },
  {
    id: "a11y",
    label: "Accessibility",
    summary: "Run automated accessibility checks against the built UI.",
  },
  {
    id: "e2e",
    label: "End to end",
    summary: "Run the primary user journeys against that artifact.",
  },
  {
    id: "performance",
    label: "Performance",
    summary: "Fail when budgets for load, LCP, or TTI are exceeded.",
  },
  {
    id: "preview",
    label: "Preview",
    summary: "Deploy the change to a temporary environment.",
  },
  {
    id: "migrate",
    label: "Migrate",
    summary: "Apply versioned database migrations before traffic moves.",
  },
  {
    id: "staging",
    label: "Staging",
    summary: "Deploy the same artifact to a production-like environment.",
  },
  {
    id: "smoke",
    label: "Smoke",
    summary: "Hit health and critical paths after a deploy before promoting.",
  },
  {
    id: "approve",
    label: "Approve",
    summary: "Require a person to approve the production deploy.",
  },
  {
    id: "canary",
    label: "Canary",
    summary: "Shift a small share of production traffic before full rollout.",
  },
  {
    id: "production",
    label: "Production",
    summary: "Deploy the approved artifact to the selected host.",
  },
  {
    id: "release",
    label: "Release",
    summary: "Publish a versioned package, image, or store build.",
  },
  {
    id: "notify",
    label: "Notify",
    summary: "Report success or failure without including secrets.",
  },
  {
    id: "rollback",
    label: "Rollback",
    summary: "Keep the previous production artifact and a way back to it.",
  },
  {
    id: "cleanup",
    label: "Cleanup",
    summary: "Remove preview environments, caches, and orphaned artifacts.",
  },
] as const;

export const automationStageIds = [
  "source",
  "setup",
  "lint",
  "typecheck",
  "test",
  "coverage",
  "integration",
  "contract",
  "security",
  "sbom",
  "build",
  "image",
  "a11y",
  "e2e",
  "performance",
  "preview",
  "migrate",
  "staging",
  "smoke",
  "approve",
  "canary",
  "production",
  "release",
  "notify",
  "rollback",
  "cleanup",
] as const;

export type AutomationStageId = (typeof automationStageIds)[number];

/** Ready-made stage sets. Order always follows automationStageIds. */
export const automationPresets = {
  verify: ["source", "setup", "lint", "typecheck", "test", "security", "build"],
  ship: [
    "source",
    "setup",
    "lint",
    "typecheck",
    "test",
    "security",
    "build",
    "e2e",
    "preview",
    "migrate",
    "staging",
    "smoke",
    "approve",
    "production",
    "notify",
    "rollback",
  ],
  full: [...automationStageIds],
} as const satisfies Record<string, readonly AutomationStageId[]>;

export type AutomationPresetId = keyof typeof automationPresets;
