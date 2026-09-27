# DATABASE.md

Hosted Supabase Postgres for saved projects and the cloud AI quota. The anonymous builder does not use the database. Its draft stays in the browser.

## Connection

The app connects with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and the user session. There is no `DATABASE_URL` and no ORM. Do not add the service-role key for normal request handling.

Development and production use the hosted project. Apply SQL from `supabase/migrations` to that project. Do not point the app at a local Docker database.

## Tables

### projects

A saved blueprint owned by one user.

| Column | Meaning |
|---|---|
| `id` | UUID primary key |
| `user_id` | Owner, references `auth.users`, deleted with the user |
| `name` | Required, 1 to 80 characters |
| `description` | Optional text |
| `configuration` | JSON document validated by `projectSchema` before write |
| `created_at`, `updated_at` | Set by the database. A trigger refreshes `updated_at` |

One user has many projects. Each project has one owner. `projects_user_id_idx` indexes `user_id`.

RLS is enabled. The policy “Users own projects” allows `select`, `insert`, `update`, and `delete` only when `auth.uid() = user_id`. `anon` has no grants.

### ai_usage

One row per user for the cloud AI window.

| Column | Meaning |
|---|---|
| `user_id` | Primary key, references `auth.users` |
| `window_start` | Start of the current hour window |
| `requests` | Calls already counted in that window |

RLS is enabled. `anon` and `authenticated` have no table grants. `private.consume_ai_quota` updates the caller’s row and returns true only when the count is at most 20. `public.consume_ai_quota` is the function routes call.

## Changes

1. Add a new file under `supabase/migrations`.
2. Review the SQL, including grants and policies.
3. Apply it once to the hosted project.
4. Do not edit a migration that has already been applied. Add another migration.
5. Do not change production tables by hand to skip a migration.
6. Do not run reset commands against the hosted database.

There is no seed script. Do not put real user rows or secrets in SQL checked into the repo.

Follow `docs/SECURITY.md` for who may read or write these tables.
