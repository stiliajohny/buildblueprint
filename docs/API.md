# API.md

HTTP routes under `src/app/api`. Responses are JSON unless `POST /api/ai` is streaming. Errors use `{ "error": "short message" }`.

The app is served from the deployment origin. Local development uses `http://localhost:3000`. There is no `/api/v1` prefix and no bearer-token API. Protected routes use the Supabase session cookie.

## Shared rules

- Validate bodies and path ids with Zod.
- Read JSON with `boundedJson` (64 KB).
- Call `validOrigin` before a state change. A present `Origin` must match the request URL origin or the `Host` the client used, or the response is HTTP 403.
- Do not put secrets, stack traces, or SQL in the response.
- Send `Cache-Control: private, no-store` on authenticated project reads.

| Status | When this app uses it |
|---|---|
| 200 | Read or update succeeded |
| 400 | Invalid body or id, or the save was rejected |
| 401 | No signed-in user |
| 403 | Origin rejected |
| 404 | Project is missing or not owned by the caller |
| 429 | Cloud AI hourly quota is spent |
| 500 | Project list could not be loaded |
| 502 | Cloud provider failed or timed out |
| 503 | Supabase is not configured, or the quota RPC failed |

## GET /api/projects

Lists the caller’s projects, newest update first.

Authentication is required. The body is empty. Success is a JSON array of project rows.

## POST /api/projects

Creates or updates one project for the caller.

Authentication and a valid origin are required.

```json
{ "id": "optional-uuid", "configuration": { } }
```

`configuration` must pass `projectSchema`. When `id` is set, the row is updated only if `user_id` matches the caller. Success returns `{ "id": "..." }`.

## GET /api/projects/:projectId

Returns one owned project. `:projectId` must be a UUID. Someone else’s id is HTTP 404.

## DELETE /api/projects/:projectId

Deletes one owned project. Requires a valid origin. Success returns `{ "deleted": true }`.

## GET /api/ai

Reports which cloud providers have a server key configured.

```json
{ "openai": true, "deepseek": false }
```

No session is required. Values are booleans. Do not add key material to this response.

## POST /api/ai

Streams a cloud answer for the signed-in user.

Authentication, a valid origin, and remaining quota are required. The quota failure is HTTP 429. An RPC failure is HTTP 503.

```json
{
  "provider": "openai",
  "prompt": "short question",
  "project": { }
}
```

`provider` is `openai` or `deepseek`. `prompt` is 1 to 2000 characters. `project` must pass `projectSchema`. Success is `text/plain` streamed from the provider, with at most 800 output tokens. The handler does not write `projects`.

## POST /api/generate

Turns a configuration into generated files. No session is required. A valid origin is required. The body is a `projectSchema` value. Success is `{ "files": { } }`. This route does not read or write the database and does not call OpenAI or DeepSeek.

## Other clients

These are not application routes:

- The browser worker downloads model files from Hugging Face after consent.
- Ollama is called on loopback from the browser.
- Supabase Auth uses `/auth/callback` for the code and OTP exchange, then redirects through `safeNextPath`.

When a new public convention is added, update this file in the same change.
