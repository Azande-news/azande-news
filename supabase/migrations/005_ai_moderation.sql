alter table public.posts
  add column if not exists ai_flagged boolean not null default false;

alter table public.posts
  add column if not exists ai_flag_reason text;
