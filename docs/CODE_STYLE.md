# CODE_STYLE.md

Conventions for this repository. Match the surrounding code.

## Stack

TypeScript, React 19, Next.js App Router, Tailwind CSS 4, Base UI, shadcn-style components, Lucide, Zod 4, Zustand. Package manager is pnpm. Formatter is Prettier (`pnpm format:check`). There is no ESLint config.

## Layout of code

- Prefer Server Components. Add `"use client"` for state, events, and browser APIs.
- Keep catalogue data, compatibility, recommendations, and generation out of React components.
- UI does not query database tables. API routes and server-side Supabase helpers do.
- Shared project state lives in `src/stores`. Request validation for HTTP lives next to the route.
- Import in-repo modules through the `@/` alias.

## Names

- Files are kebab-case: `builder-store.ts`, `page-header.tsx`.
- Component functions are PascalCase: `PageHeader`.
- Functions and variables are camelCase.
- Constants that are fixed tokens are UPPER_SNAKE_CASE, as with `BROWSER_LLM_COOKIE`.
- Booleans read as states: `configured`, `turningOn`, `busy`.

## Components and types

- Use function components.
- Give props a TypeScript type.
- Cover loading, error, and empty states on screens that fetch or wait.
- Reuse `src/components/ui` before adding another control.
- Keep the dense light layout: no gradients or large shadows. Header 46px, sidebar 274px, summary 356px. Cards use an 8px radius and are at least 74px tall.

## Comments

Use a short JSDoc on an export when the name does not already say why it exists. Do not comment obvious assignments.

## Before finishing

- Run `pnpm typecheck` and `pnpm test`.
- Run `pnpm test:e2e` when a critical browser flow changed.
- Run `pnpm format:check` on the files you touched.
- Remove debug logs and unused imports.
- Check the layout you changed at a narrow width and at desktop width.
- Tests mock the browser worker and must not download model weights.
