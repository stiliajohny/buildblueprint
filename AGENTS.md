# BuildBlueprint Engineering Rules
Use strict TypeScript and Next.js App Router. Prefer Server Components, with client boundaries for state and browser APIs. Keep catalogue data, compatibility, recommendations and generation separate from React. Validate external input with Zod. Never access database tables directly from UI components.
Use Base UI primitives, shadcn-style components, Tailwind tokens and Lucide. Maintain the supplied dense light developer-tool design: no gradients or large shadows; header 46px, sidebar 274px, summary 356px. Cards have 8px radius and at least 74px height.
Cloud AI secrets stay server-side. Browser AI runs only in a Worker and never sends prompts to application APIs. Never download model weights automatically: expose size and licence and obtain explicit consent.
Add unit tests for rules and generation and Playwright coverage for critical flows. Mock workers in CI; never download real model weights in CI.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
