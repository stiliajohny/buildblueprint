# SECURITY_CHECKLIST.md

Release check for BuildBlueprint. Status is against the current code and the hosted-project steps in the README. “Open” items block a public launch until they are done or explicitly accepted. “Out of scope” items are not product features.

## Authentication and sessions

| Check | Status | Evidence |
|---|---|---|
| Session is in Supabase cookies, not `localStorage` | Met | `@supabase/ssr` in `src/lib/supabase/server.ts` and `src/proxy.ts` |
| Password hashes stay in Supabase Auth | Met | No password table in the migration |
| Reset and sign-in redirects stay on this app | Met | `safeNextPath` |
| Password policy is at least 12 characters with breached-password checks | Open | Reset copy says 8 characters. Set the policy in the Supabase project |
| Logout or password change revokes other sessions | Open | Confirm in the Supabase session settings before launch |
| Admin MFA | Out of scope | No admin role |

## Data isolation

| Check | Status | Evidence |
|---|---|---|
| RLS on `projects` | Met | Policy “Users own projects” |
| `ai_usage` hidden from the client | Met | Grants revoked; quota goes through the RPC |
| Project routes filter `user_id` and return 404 for other owners | Met | `src/app/api/projects` |
| Admin routes reject normal users | Out of scope | No admin API |

## Secrets and configuration

| Check | Status | Evidence |
|---|---|---|
| `.env*` ignored, `.env.example` has placeholders only | Met | `.gitignore`, `.env.example` |
| Server keys have no `NEXT_PUBLIC_` prefix | Met | OpenAI and DeepSeek keys |
| Service-role key is not in the app | Met | Not in `.env.example` or `src/` |
| Git history and the production bundle scanned for secrets | Open | No scanner in CI |
| Production SMTP, email confirmation, auth rate limits, bot protection | Open | README launch steps; set them in Supabase |

## API

| Check | Status | Evidence |
|---|---|---|
| Bodies and ids validated with Zod | Met | Project, AI, and generate routes |
| Queries use the Supabase client, not concatenated SQL | Met | Route handlers |
| JSON body limit | Met | 64 KB in `boundedJson` |
| Origin check on state-changing routes | Met | `validOrigin` |
| Cloud AI quota fails closed | Met | 20 requests per user per hour, HTTP 429 when exhausted |
| Client errors omit stack traces and keys | Met | `{ "error": "..." }` |
| Per-IP auth rate limit inside this repo | Open | Configure it in Supabase. Do not add a second limiter only to match a template number |

## AI

| Check | Status | Evidence |
|---|---|---|
| System and user messages are separate roles | Met | `src/app/api/ai/route.ts` |
| Browser prompts are not sent to app APIs | Met | Worker path and consent cookie |
| Model download waits for consent | Met | `bb-browser-llm` |
| Cloud route cannot write projects by itself | Met | It only streams text |
| Provider spend cap in the OpenAI and DeepSeek accounts | Open | Set a hard cap in each provider console |
| Automated prompt-injection suite | Open | Not in `src/tests` |

## Headers and supply chain

| Check | Status | Evidence |
|---|---|---|
| `nosniff`, referrer policy, frame denial | Met | `next.config.ts` |
| `X-Powered-By` removed | Met | `poweredByHeader: false` |
| HSTS on the public host | Open | Set at Vercel or Cloudflare |
| Content-Security-Policy | Open | Add only a policy that has been tried against the theme script, fonts, and worker |
| CI typecheck, unit tests, Playwright, production build | Met | `.github/workflows/ci.yml` |
| CI fails on known vulnerable dependencies | Open | No audit step in that workflow |
| File upload magic-byte checks | Out of scope | No upload route |

## Scorecard

Do not mark the app ready for a public launch while any row above is still Open. Out of scope rows are not launch blockers.
