alter table public.posts
  drop constraint if exists posts_status_check;

alter table public.posts
  add constraint posts_status_check
  check (status in ('draft', 'pending', 'scheduled', 'published', 'removed'));

-- Read policy: pending posts are visible only to their author and admins (not the public)
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
