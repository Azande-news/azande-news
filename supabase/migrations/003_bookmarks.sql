create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

alter table public.bookmarks enable row level security;

create policy "Users can view their own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can create their own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

create index if not exists bookmarks_user_id_idx on public.bookmarks (user_id);
