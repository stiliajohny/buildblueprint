# SECURITY.md

Security requirements for BuildBlueprint. Human engineers and coding agents follow these rules. This file describes the application that exists: a Next.js App Router app, hosted Supabase Auth and Postgres, and three AI paths (cloud, browser worker, loopback Ollama).

## Principles

- Do not trust the browser, local drafts, or model output. Authenticate on the server and authorize with the signed-in user id.
- Keep a second boundary in the database. Row Level Security stays on even when a query already filters by `user_id`.
- Use the least privilege that works. The app uses the Supabase publishable key and the user session. It does not use the service-role key.
- If auth, origin, validation, or the quota call fails, deny the action.

## Authentication

Supabase Auth issues the session. The app does not store password hashes.

- `src/proxy.ts` refreshes the session on `/projects`, `/api/projects`, `/api/ai`, and `/auth`.
- Protected handlers call `getUser()` through `src/lib/supabase/server.ts`. A missing user is HTTP 401.
- Session cookies come from `@supabase/ssr`. Do not copy access tokens into `localStorage` or `sessionStorage`.
- `localStorage` may hold the builder draft (`buildblueprint-project`), theme preference, and summary width. Those values are not credentials. Reload them through `projectSchema`.
- Post-login redirects go through `safeNextPath`. Only `/builder`, `/projects`, `/projects/...`, and `/auth/update-password` are allowed.
- The password reset screen tells the user to use at least 8 characters. Length and breached-password checks belong in the Supabase Auth password policy, not in a custom table.
- There is no admin role and no step-up MFA in the app. Phone OTP is a sign-in method when Twilio is configured in Supabase.

## Authorization

Tenant isolation is one user, many projects. `public.projects.user_id` references `auth.users`. The policy “Users own projects” requires `auth.uid() = user_id` for every command.

- Every project read, update, and delete also filters `user_id` to the signed-in user.
- A project the caller does not own returns HTTP 404.
- `public.ai_usage` is revoked from `anon` and `authenticated`. Quota changes go through `public.consume_ai_quota`, which calls `private.consume_ai_quota`. Do not grant table access to skip the function.
- Do not add role checks or `/api/admin` routes unless the product gains roles.

## Input and queries

- Validate request bodies and ids with Zod. Reject invalid payloads with HTTP 400.
- Read JSON through `boundedJson` (64 KB). Oversized bodies are rejected.
- State-changing routes call `validOrigin`. The `Origin` header must be absent or match the request origin.
- Use the Supabase client filters. Do not build SQL by concatenating request strings.
- User-facing JSON errors are `{ "error": "short message" }`. Do not return stack traces, SQL, keys, or file paths.

## Secrets

Environment variables live in `.env.local` and the host. `.gitignore` ignores `.env*` and keeps `.env.example`.

| Name | Where it may appear |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser and server |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Server only |
| `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL` | Server only |

- Do not add a `NEXT_PUBLIC_` prefix to a secret.
- Do not put the service-role key, database URL, or provider keys in source, Markdown, or the client bundle.
- `GET /api/ai` may report whether a cloud provider is configured. It must return booleans, never key material.
- CI does not run a secret scanner. Before a public launch, scan git history and confirm the production bundle has no server keys.

## AI boundaries

Cloud, browser, and Ollama stay separate.

- `POST /api/ai` requires a signed-in user, an origin check, Zod validation, and `consume_ai_quota`. The quota is 20 requests per user per rolling hour. A quota error or a null user denies the call. Output is capped at 800 tokens.
- The cloud system message and the user prompt are separate chat roles. `projectContext` tells the model to treat the project description as data. The handler streams provider text back. It does not call tools, write the database, or send mail.
- Browser inference runs in a worker. The `bb-browser-llm` cookie records accept or decline for 180 days. It is not `HttpOnly`, because the page must read it. It is not a session. A download starts only after consent. Prompts stay in the worker and are not posted to application APIs.
- Ollama stays on loopback. Do not point the app at a public Ollama URL.

Do not send the model a service key, another user’s project, or the contents of `ai_usage`. Project name, description, selected technologies, requirements, deployment profile, compatibility notes, and the master prompt are the cloud context. There is no separate PII redaction step. Do not add fields such as secrets or payment data to that context.

## HTTP headers

`next.config.ts` sets `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-Frame-Options: DENY`, and disables `X-Powered-By`.

HSTS belongs on the HTTPS host (Vercel or Cloudflare). A Content-Security-Policy is not set. Add one only after checking it against the theme script, fonts, and worker. Do not paste a generic `default-src 'self'` policy that breaks the app.

`dangerouslySetInnerHTML` is limited to the fixed theme bootstrap script in `src/lib/theme.ts`. Do not use it for project text, model output, or request data.

## What agents must not do

- Invent or hardcode credentials.
- Disable auth, RLS, the origin check, or the quota call to make a feature work.
- Query `ai_usage` from the browser or from a UI component.
- Expose server secrets in client code or in `NEXT_PUBLIC_` variables.
- Add an LLM tool that writes or deletes data.
- Treat this file as a substitute for the checks in the route handlers and the migration.

## Out of scope

These controls are in generic kits and are not part of this product. Do not add them only to match a template.

- Custom password hashes, admin RBAC, and admin MFA.
- File upload, object storage, and presigned URLs.
- Redis or edge rate-limit packages. Auth throttling is configured in Supabase before launch. Cloud AI throttling is the database quota above.
- Payment webhooks and a billing admin.
- A second tenant id. Ownership is `user_id`.

## Before public launch

Configure in Supabase, not in a new password table: production SMTP, email confirmation, auth rate limits, bot protection, and the password policy. Confirm OAuth and SMS only for providers that are enabled. The sign-in form’s social buttons are currently commented out.
