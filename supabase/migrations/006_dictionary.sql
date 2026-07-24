create table if not exists public.dictionary_entries (
  id uuid primary key default gen_random_uuid(),
  zande_word text not null check (char_length(zande_word) between 1 and 100),
  english_translation text not null check (char_length(english_translation) between 1 and 200),
  notes text,
  submitted_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.dictionary_entries enable row level security;

create policy "Approved entries are publicly viewable"
  on public.dictionary_entries for select
  using (
    status = 'approved'
    or auth.uid() = submitted_by
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Logged-in users can submit dictionary entries"
  on public.dictionary_entries for insert
  with check (auth.uid() = submitted_by);

create policy "Admins can update dictionary entries"
  on public.dictionary_entries for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can delete dictionary entries"
  on public.dictionary_entries for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create index if not exists dictionary_entries_word_idx on public.dictionary_entries (zande_word);
create index if not exists dictionary_entries_status_idx on public.dictionary_entries (status);
