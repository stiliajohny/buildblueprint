# Supabase

BuildBlueprint uses a hosted Supabase project for authentication, saved projects, and the cloud AI quota. Local Docker is not part of this setup.

Copy the Supabase values from `.env.example` into `.env.local` and replace them with the hosted project URL and publishable key. Leave the secret key in the Supabase dashboard.

Apply the SQL file in `migrations` once to that hosted project, from the SQL editor or with `supabase db push` after the CLI is linked to the same project. The migration creates `projects` and `ai_usage`, enables row level security, and keeps the quota function in the private schema.
