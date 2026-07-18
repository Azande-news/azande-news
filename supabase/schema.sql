-- ============================================================
-- Azande News — Database schema + security policies
-- Run this once in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste all -> Run)
-- ============================================================

-- 1. PROFILES
-- One row per registered user. Created automatically on sign-up.
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  bio text default '',
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Anyone (even logged out visitors) can view public profile info.
create policy "Profiles are publicly viewable"
  on public.profiles for select
  using (true);

-- A user can only edit their own profile.
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. POSTS
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 200),
  body text not null check (char_length(body) between 10 and 20000),
  category text not null default 'general'
    check (category in ('general','culture','history','language','diaspora','community','announcements')),
  cover_image_url text,
  status text not null default 'published' check (status in ('published','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts enable row level security;

-- The whole world can read published posts. No login required to read.
create policy "Published posts are publicly viewable"
  on public.posts for select
  using (status = 'published' or auth.uid() = author_id);

-- Only a logged-in user can create a post, and only as themself.
create policy "Logged-in users can create their own posts"
  on public.posts for insert
  with check (auth.uid() = author_id);

-- Only the author (or an admin) can edit their post.
create policy "Authors and admins can update posts"
  on public.posts for update
  using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Only the author (or an admin) can delete their post.
create policy "Authors and admins can delete posts"
  on public.posts for delete
  using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Keep updated_at fresh.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- 3. AUTO-CREATE A PROFILE WHEN SOMEONE REGISTERS
-- Reads the username/display_name passed in at sign-up time.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3b. ADMINS CAN MANAGE ANY PROFILE (e.g. promote someone to admin)
create policy "Admins can update any profile"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- 3c. ADMINS CAN SEE REMOVED POSTS TOO (for the moderation dashboard)
create policy "Admins can view all posts"
  on public.posts for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 3d. COMMENTS
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "Comments are publicly viewable"
  on public.comments for select
  using (true);

create policy "Logged-in users can comment"
  on public.comments for insert
  with check (auth.uid() = author_id);

create policy "Authors and admins can delete comments"
  on public.comments for delete
  using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create index if not exists comments_post_idx on public.comments (post_id);

-- 3e. REPORTS (flagging a post for admin review)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

-- Reports are private: only admins can read them, so reporting someone
-- can't be used to snoop. Anyone logged in can file one.
create policy "Logged-in users can file a report"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "Admins can view reports"
  on public.reports for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can resolve reports"
  on public.reports for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create index if not exists reports_status_idx on public.reports (status);

-- 4. USEFUL INDEXES
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_category_idx on public.posts (category);
create index if not exists posts_author_idx on public.posts (author_id);

-- 5. IMAGE STORAGE BUCKET (for cover photos)
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy "Anyone can view post images"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "Logged-in users can upload post images"
  on storage.objects for insert
  with check (bucket_id = 'post-images' and auth.role() = 'authenticated');
