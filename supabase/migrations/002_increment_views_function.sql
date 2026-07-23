create or replace function public.increment_post_views(post_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.posts set views = views + 1 where id = post_id and status = 'published';
$$;

grant execute on function public.increment_post_views(uuid) to anon, authenticated;
