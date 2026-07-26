create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a <> user_b)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Participants can view their conversations"
  on public.conversations for select
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "Users can start a conversation"
  on public.conversations for insert
  with check (auth.uid() = requested_by and (auth.uid() = user_a or auth.uid() = user_b));

create policy "Participants can update conversation status"
  on public.conversations for update
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "Participants can view messages in their conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and (conversations.user_a = auth.uid() or conversations.user_b = auth.uid())
    )
  );

create policy "Participants can send messages in accepted conversations"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and conversations.status = 'accepted'
      and (conversations.user_a = auth.uid() or conversations.user_b = auth.uid())
    )
  );

create index if not exists conversations_user_a_idx on public.conversations (user_a);
create index if not exists conversations_user_b_idx on public.conversations (user_b);
create index if not exists messages_conversation_id_idx on public.messages (conversation_id);
