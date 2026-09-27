-- Apply once in a new Supabase project via the SQL editor or CLI migration.
create table if not exists public.projects (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (length(name) between 1 and 80),
 description text,
 configuration jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists projects_user_id_idx on public.projects(user_id);
alter table public.projects enable row level security;
create policy "Users own projects" on public.projects for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.projects to authenticated;
revoke all on public.projects from anon;
create or replace function public.set_project_updated_at() returns trigger language plpgsql security invoker set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
create trigger project_updated_at before update on public.projects for each row execute function public.set_project_updated_at();
-- Durable, per-user cloud AI quota; serializes concurrent calls across instances.
create table public.ai_usage (user_id uuid primary key references auth.users(id) on delete cascade, window_start timestamptz not null default now(), requests integer not null default 0);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;
create schema if not exists private;
create or replace function private.consume_ai_quota() returns boolean language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); n integer;
begin
 if uid is null then return false; end if;
 insert into public.ai_usage(user_id,requests) values(uid,1)
 on conflict(user_id) do update set
 requests = case when public.ai_usage.window_start < now() - interval '1 hour' then 1 else public.ai_usage.requests + 1 end,
 window_start = case when public.ai_usage.window_start < now() - interval '1 hour' then now() else public.ai_usage.window_start end
 returning requests into n;
 return n <= 20;
end; $$;
revoke all on function private.consume_ai_quota() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.consume_ai_quota() to authenticated;
create or replace function public.consume_ai_quota() returns boolean language sql security invoker set search_path = '' as $$ select private.consume_ai_quota(); $$;
revoke all on function public.consume_ai_quota() from public, anon;
grant execute on function public.consume_ai_quota() to authenticated;
