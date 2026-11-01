-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It creates the run log and the memory the daily jobs use to avoid repeating stories.

create table if not exists public.news_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  job text not null,
  section text,
  status text not null,
  source_url text,
  post_id uuid,
  message text,
  details jsonb
);

create index if not exists news_runs_created_idx on public.news_runs (created_at desc);
create index if not exists news_runs_source_idx on public.news_runs (source_url);

alter table public.news_runs enable row level security;

drop policy if exists "admins read news runs" on public.news_runs;
create policy "admins read news runs" on public.news_runs
  for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));