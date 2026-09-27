import type { Technology } from "@/types/technology";

const managers = ["npm", "pnpm", "yarn", "bun", "deno"] as const;

/** One mutually exclusive JavaScript runtime and package manager. */
function runtime(
  id: (typeof managers)[number],
  name: string,
  description: string,
  website: string,
): Technology {
  return {
    id,
    logo: `/logos/${id}.svg`,
    name,
    slug: id,
    category: "runtime",
    description,
    website,
    openSource: true,
    deployment: {
      saas: false,
      selfHosted: true,
      local: true,
      browser: false,
    },
    capabilities: ["runtime"],
    recommendedFor: [],
    alternatives: managers.filter((other) => other !== id),
    conflictsWith: managers.filter((other) => other !== id),
    tags: ["runtime", "javascript"],
    maturity: "stable",
  };
}

export const technologies: Technology[] = [
  runtime(
    "npm",
    "npm",
    "Node.js with the npm package manager",
    "https://www.npmjs.com",
  ),
  runtime(
    "pnpm",
    "pnpm",
    "Node.js with the pnpm package manager",
    "https://pnpm.io",
  ),
  runtime(
    "yarn",
    "Yarn",
    "Node.js with the Yarn package manager",
    "https://yarnpkg.com",
  ),
  runtime(
    "bun",
    "Bun",
    "Bun runtime, bundler and package manager",
    "https://bun.sh",
  ),
  runtime(
    "deno",
    "Deno",
    "Deno runtime with built-in TypeScript",
    "https://deno.com",
  ),
];
