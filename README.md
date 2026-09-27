# BuildBlueprint

Next.js App Router application for configuring technology stacks and exporting portable implementation blueprints.

## Run locally

Requires Node.js 22+ and pnpm 11.25.0.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000. The anonymous builder, templates, deterministic recommendations, compatibility checks, local draft persistence and ZIP/JSON exports work without credentials.

```bash
pnpm typecheck
pnpm test
pnpm exec playwright install --with-deps chromium
pnpm test:e2e
pnpm build
pnpm start
```

For a managed development runner, `scripts/dev.mjs` accepts `--host`, `--port` and `--strictPort` while retaining Next.js. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` optionally selects a preinstalled Chromium executable for tests.

## Features

- 13-step builder, Guided and Expert modes, desktop/sidebar layout and mobile sheets.
- 129 catalogue entries covering all requested technology families; brand vectors from Simple Icons where available.
- Recursive dependency selection; warnings for overlapping identity providers, web frameworks and managed services in self-hosted profiles; React UI incompatibility checks.
- Requirement-based recommendations, 11 presets and Cmd/Ctrl+K search.
- Reactive project summary, file preview, master-prompt copying, ZIP download, JSON import/export and versioned local persistence.
- Canonical STACK.yaml with project, clients, services, libraries, security and deployment choices.
- Markdown rules and prompts, IDE instructions and conditional infrastructure starting templates.
- Supabase authentication, private project CRUD, RLS policies and persistent cloud AI quotas.
- OpenAI and DeepSeek server streaming; loopback-only Ollama client; consent-gated Transformers.js WebGPU worker with local chat.

## Configure account persistence

1. Create/select a Supabase project.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Apply the SQL migration in `supabase/migrations` once to the hosted project. Existing databases should receive a reviewed migration, not a blind re-run.
4. Add `http://localhost:3000/auth/callback` and your deployed origin's `/auth/callback` to Supabase redirect URLs. Set the Site URL to the deployed origin.
5. Enable the desired OAuth providers: Google, Apple, Facebook and LinkedIn OIDC, with their own credentials.
6. Configure Twilio in Supabase for SMS OTP. For email OTP, use an email template containing `{{ .Token }}`; magic links use `{{ .ConfirmationURL }}`. A template may include both.
7. Configure production SMTP, email confirmation, auth rate limits and bot protection before public launch.

The browser uses only the publishable key. API routes validate the user with Supabase, constrain queries by owner and rely on RLS as a second boundary. A private schema contains the quota implementation; an authenticated invoker wrapper exposes only the caller's quota operation.

## AI configuration

- **OpenAI:** Set `OPENAI_API_KEY` and optionally `OPENAI_MODEL` server-side.
- **DeepSeek:** Set `DEEPSEEK_API_KEY` and optionally `DEEPSEEK_MODEL` server-side.
- **Cloud requests:** Require authenticated users and the `consume_ai_quota` RPC. Maximum 20 requests/hour/user and 800 output tokens/request. Provisioning these keys is not required for the rest of the builder.
- **Browser AI:** HTTPS or localhost, WebGPU adapter, sufficient storage/memory and explicit licence/download consent are required. The first visit asks, via the `bb-browser-llm` cookie, whether to pull a local model. Declining or accepting is remembered for 180 days and never starts a download by itself. Models are fetched directly from Hugging Face. The side-panel Chat window discusses the current choices. On the review step, notes can be sent into that chat; a reply replaces the exported master prompt only after Use as master prompt. Inference stays in the worker; no fallback silently sends it to cloud APIs. Browser caching is best effort and may be evicted.
- **Ollama:** Install the selected model locally and set `OLLAMA_ORIGINS` to the exact application origin. Keep the server on loopback. Browser mixed-content and private-network restrictions may require local development or browser support. Never expose an unauthenticated Ollama endpoint publicly.

Small browser models can produce poor architectural advice. Compatibility and recommendations remain deterministic. Tests mock the worker and never download weights.

## Deploy to Vercel

Import the repository, use the Next.js preset, install with `pnpm install --frozen-lockfile` and build with `pnpm build`. Configure the environment variables above before deploying. No deployment credentials are committed. Add the domain in Vercel, then apply Vercel's supplied DNS records in Cloudflare; keep DNS-only until domain verification completes. Configure caching deliberately for authenticated responses.

Alternatively, deploy the standalone output using the included Dockerfile. It runs as a non-root user.

## Architecture

`src/catalogue` contains technology data. `src/features` contains deterministic rules, project access and generation. `src/stores` owns the shared project model. `src/lib/ai` and `src/lib/browser-ai` keep cloud/local security boundaries separate. `src/app/api` validates external requests. UI components do not query database tables directly.

## Verification and limitations

See [VERIFICATION.md](VERIFICATION.md) for actual validation results and remaining external checks. The reference screenshot was not supplied; the UI follows the written dimensions, tokens and visual direction.

Generated packs describe an application; they do not generate a fully implemented application. Infrastructure output is an explicit starting template and includes placeholders where account-specific values are unknown. Pricing and compatibility must be checked against provider documentation when implementing a generated blueprint.

Public template links are implemented. Public sharing of private saved blueprints remains deferred, as described in the specification's future URL-state phase.

Brand SVGs are sourced from Simple Icons (CC0 collection). Brand trademarks remain the property of their owners. Review individual model licences before use.
