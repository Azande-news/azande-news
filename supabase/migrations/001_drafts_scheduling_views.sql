-- Add draft/scheduled publishing support and view tracking to posts

alter table public.posts
  drop constraint if exists posts_status_check;

alter table public.posts
  add constraint posts_status_check
  check (status in ('draft', 'scheduled', 'published', 'removed'));

alter table public.posts
  add column if not exists publish_at timestamptz;

alter table public.posts
  add column if not exists views integer not null default 0;

-- Replace the read policy so drafts/scheduled posts are only visible to their author or admins
drop policy if exists "Published posts are publicly viewable" on public.posts;

create policy "Published posts are publicly viewable"
  on public.posts for select
  using (
    status = 'published'
    or auth.uid() = author_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create index if not exists posts_views_idx on public.posts (views desc);
create index if not exists posts_publish_at_idx on public.posts (publish_at);
