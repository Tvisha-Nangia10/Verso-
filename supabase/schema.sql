-- ════════════════════════════════════════════════════════════════
--  TH-INK — database schema
--  Run this first, then seed.sql, in the Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─────────────────────────── profiles ───────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  handle        text unique not null,
  name          text not null,
  bio           text default '',
  initials      text default '',
  avatar_bg     text default '#d4e8d0',
  avatar_color  text default '#3a7a50',
  avatar_url    text,
  accent        text default 'amber',
  location      text default '',
  website       text default '',
  topics        text[] default '{}',
  prefs         jsonb  default '{}'::jsonb,
  craft_score   int    default 0,
  streak_days   int    default 0,
  created_at    timestamptz default now()
);

-- ─────────────────────────── articles ───────────────────────────
create table if not exists public.articles (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  subtitle      text default '',
  body          text default '',
  tag           text default '',
  genre         text,
  form          text,
  theme         text,
  tone          text,
  cover_grad    text default 'linear-gradient(135deg,#1e1810,#3a2518)',
  cover_accent  text default 'rgba(200,98,10,.35)',
  read_time     text default '1 min',
  word_count    int  default 0,
  status        text not null default 'draft' check (status in ('draft','published')),
  audience      text not null default 'everyone',
  published_at  timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists articles_author_idx on public.articles(author_id);
create index if not exists articles_status_idx on public.articles(status, published_at desc);

-- ──────────────────────── social graph ──────────────────────────
create table if not exists public.follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.likes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, article_id)
);

create table if not exists public.bookmarks (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  folder     text default 'Read later',
  created_at timestamptz default now(),
  primary key (user_id, article_id)
);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  parent_id  uuid references public.comments(id) on delete cascade,
  body       text not null,
  created_at timestamptz default now()
);
create index if not exists comments_article_idx on public.comments(article_id, created_at);

-- ────────────────────────── collections ─────────────────────────
create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  description text default '',
  color       text default 'amber',
  is_public   boolean default true,
  created_at  timestamptz default now()
);

create table if not exists public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  article_id    uuid not null references public.articles(id) on delete cascade,
  added_at      timestamptz default now(),
  primary key (collection_id, article_id)
);

-- ─────────────────────── notes & annotations ────────────────────
create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text default 'Untitled note',
  body       text default '',
  color      text default 'pastel-yellow',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.annotations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  article_id uuid references public.articles(id) on delete cascade,
  quote      text not null,
  note       text default '',
  color      text default 'pastel-yellow',
  created_at timestamptz default now()
);

-- ───────────────────────── messaging ────────────────────────────
create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  last_read_at    timestamptz default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null,
  created_at      timestamptz default now()
);
create index if not exists messages_conv_idx on public.messages(conversation_id, created_at);

-- Helper: is the current user a participant of this conversation?
-- SECURITY DEFINER avoids the participants <-> conversations RLS recursion.
create or replace function public.is_conversation_member(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_participants p
    where p.conversation_id = cid and p.user_id = auth.uid()
  );
$$;

-- Find (or create) the 1:1 conversation between the caller and another user.
create or replace function public.get_or_create_dm(other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
begin
  if other_user = auth.uid() then
    raise exception 'cannot DM yourself';
  end if;

  select p.conversation_id into cid
  from public.conversation_participants p
  join public.conversation_participants q
    on q.conversation_id = p.conversation_id
  where p.user_id = auth.uid()
    and q.user_id = other_user
  limit 1;

  if cid is null then
    insert into public.conversations default values returning id into cid;
    insert into public.conversation_participants (conversation_id, user_id)
    values (cid, auth.uid()), (cid, other_user);
  end if;

  return cid;
end;
$$;

-- ─────────────────────── reading rooms ──────────────────────────
create table if not exists public.rooms (
  id          uuid primary key default gen_random_uuid(),
  host_id     uuid not null references public.profiles(id) on delete cascade,
  article_id  uuid references public.articles(id) on delete set null,
  title       text not null,
  description text default '',
  is_live     boolean default true,
  started_at  timestamptz default now()
);

create table if not exists public.room_participants (
  room_id   uuid not null references public.rooms(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (room_id, user_id)
);

create table if not exists public.room_messages (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.rooms(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  body       text,
  emoji      text,
  created_at timestamptz default now()
);
create index if not exists room_messages_idx on public.room_messages(room_id, created_at);

-- ──────────────────────── notifications ─────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  actor_id   uuid references public.profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text default '',
  action     text,
  target_id  uuid,
  read       boolean default false,
  created_at timestamptz default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);

-- ──────────────────────── time capsule ──────────────────────────
create table if not exists public.time_capsules (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  body       text default '',
  deliver_at timestamptz not null,
  delivered  boolean default false,
  created_at timestamptz default now()
);

-- ─────────────────── insights / writing DNA ─────────────────────
create table if not exists public.writing_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  day        date not null default current_date,
  words      int  default 0,
  minutes    int  default 0,
  unique (user_id, day)
);

create table if not exists public.writing_dna (
  user_id         uuid primary key references public.profiles(id) on delete cascade,
  craft_score     int default 0,
  traits          jsonb default '[]'::jsonb,
  signature_words jsonb default '[]'::jsonb,
  influences      jsonb default '[]'::jsonb,
  rhythm          jsonb default '{}'::jsonb,
  updated_at      timestamptz default now()
);

-- ─────────────────────── AI chat (Gemini) ───────────────────────
create table if not exists public.ai_conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text default 'New chat',
  created_at timestamptz default now()
);

create table if not exists public.ai_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role            text not null check (role in ('user','model')),
  content         text not null,
  created_at      timestamptz default now()
);
create index if not exists ai_messages_idx on public.ai_messages(conversation_id, created_at);

-- ════════════════════════════════════════════════════════════════
--  New-user trigger: create a profile row for every signup
--  (works for email/password and Google OAuth)
-- ════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_handle text;
  final_handle text;
  n int := 0;
  display_name text;
begin
  display_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  base_handle := regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g');
  if base_handle = '' then base_handle := 'writer'; end if;
  final_handle := base_handle;

  while exists (select 1 from public.profiles where handle = final_handle) loop
    n := n + 1;
    final_handle := base_handle || n::text;
  end loop;

  insert into public.profiles (id, handle, name, initials, avatar_url)
  values (
    new.id,
    final_handle,
    display_name,
    upper(substr(display_name, 1, 1) ||
          coalesce(substr(split_part(display_name, ' ', 2), 1, 1), '')),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.writing_dna (user_id) values (new.id) on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ════════════════════════════════════════════════════════════════
--  Row Level Security
-- ════════════════════════════════════════════════════════════════
alter table public.profiles                  enable row level security;
alter table public.articles                  enable row level security;
alter table public.follows                   enable row level security;
alter table public.likes                     enable row level security;
alter table public.bookmarks                 enable row level security;
alter table public.comments                  enable row level security;
alter table public.collections               enable row level security;
alter table public.collection_items          enable row level security;
alter table public.notes                     enable row level security;
alter table public.annotations               enable row level security;
alter table public.conversations             enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages                  enable row level security;
alter table public.rooms                     enable row level security;
alter table public.room_participants         enable row level security;
alter table public.room_messages             enable row level security;
alter table public.notifications             enable row level security;
alter table public.time_capsules             enable row level security;
alter table public.writing_sessions          enable row level security;
alter table public.writing_dna               enable row level security;
alter table public.ai_conversations          enable row level security;
alter table public.ai_messages               enable row level security;

-- profiles: world-readable, self-writable
drop policy if exists profiles_read   on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_read   on public.profiles for select using (true);
create policy profiles_insert on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update on public.profiles for update using (auth.uid() = id);

-- articles: published ones are public; drafts only to their author
drop policy if exists articles_read   on public.articles;
drop policy if exists articles_write  on public.articles;
drop policy if exists articles_update on public.articles;
drop policy if exists articles_delete on public.articles;
create policy articles_read on public.articles for select
  using (status = 'published' or author_id = auth.uid());
create policy articles_write  on public.articles for insert with check (author_id = auth.uid());
create policy articles_update on public.articles for update using (author_id = auth.uid());
create policy articles_delete on public.articles for delete using (author_id = auth.uid());

-- follows
drop policy if exists follows_read on public.follows;
drop policy if exists follows_write on public.follows;
drop policy if exists follows_delete on public.follows;
create policy follows_read   on public.follows for select using (true);
create policy follows_write  on public.follows for insert with check (follower_id = auth.uid());
create policy follows_delete on public.follows for delete using (follower_id = auth.uid());

-- likes
drop policy if exists likes_read on public.likes;
drop policy if exists likes_write on public.likes;
drop policy if exists likes_delete on public.likes;
create policy likes_read   on public.likes for select using (true);
create policy likes_write  on public.likes for insert with check (user_id = auth.uid());
create policy likes_delete on public.likes for delete using (user_id = auth.uid());

-- bookmarks (private)
drop policy if exists bookmarks_all on public.bookmarks;
create policy bookmarks_all on public.bookmarks for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- comments
drop policy if exists comments_read on public.comments;
drop policy if exists comments_write on public.comments;
drop policy if exists comments_update on public.comments;
drop policy if exists comments_delete on public.comments;
create policy comments_read   on public.comments for select using (true);
create policy comments_write  on public.comments for insert with check (user_id = auth.uid());
create policy comments_update on public.comments for update using (user_id = auth.uid());
create policy comments_delete on public.comments for delete using (user_id = auth.uid());

-- collections
drop policy if exists collections_read on public.collections;
drop policy if exists collections_write on public.collections;
drop policy if exists collections_update on public.collections;
drop policy if exists collections_delete on public.collections;
create policy collections_read   on public.collections for select
  using (is_public or user_id = auth.uid());
create policy collections_write  on public.collections for insert with check (user_id = auth.uid());
create policy collections_update on public.collections for update using (user_id = auth.uid());
create policy collections_delete on public.collections for delete using (user_id = auth.uid());

drop policy if exists collection_items_read on public.collection_items;
drop policy if exists collection_items_write on public.collection_items;
create policy collection_items_read on public.collection_items for select
  using (exists (select 1 from public.collections c
                 where c.id = collection_id and (c.is_public or c.user_id = auth.uid())));
create policy collection_items_write on public.collection_items for all
  using (exists (select 1 from public.collections c
                 where c.id = collection_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.collections c
                 where c.id = collection_id and c.user_id = auth.uid()));

-- notes / annotations (private)
drop policy if exists notes_all on public.notes;
create policy notes_all on public.notes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists annotations_all on public.annotations;
create policy annotations_all on public.annotations for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- messaging
drop policy if exists conversations_read on public.conversations;
create policy conversations_read on public.conversations for select
  using (public.is_conversation_member(id));

drop policy if exists cparts_read on public.conversation_participants;
drop policy if exists cparts_update on public.conversation_participants;
create policy cparts_read on public.conversation_participants for select
  using (public.is_conversation_member(conversation_id));
create policy cparts_update on public.conversation_participants for update
  using (user_id = auth.uid());

drop policy if exists messages_read on public.messages;
drop policy if exists messages_write on public.messages;
create policy messages_read on public.messages for select
  using (public.is_conversation_member(conversation_id));
create policy messages_write on public.messages for insert
  with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));

-- reading rooms
drop policy if exists rooms_read on public.rooms;
drop policy if exists rooms_write on public.rooms;
drop policy if exists rooms_update on public.rooms;
create policy rooms_read   on public.rooms for select using (true);
create policy rooms_write  on public.rooms for insert with check (host_id = auth.uid());
create policy rooms_update on public.rooms for update using (host_id = auth.uid());

drop policy if exists rparts_read on public.room_participants;
drop policy if exists rparts_write on public.room_participants;
drop policy if exists rparts_delete on public.room_participants;
create policy rparts_read   on public.room_participants for select using (true);
create policy rparts_write  on public.room_participants for insert with check (user_id = auth.uid());
create policy rparts_delete on public.room_participants for delete using (user_id = auth.uid());

drop policy if exists rmsg_read on public.room_messages;
drop policy if exists rmsg_write on public.room_messages;
create policy rmsg_read  on public.room_messages for select using (true);
create policy rmsg_write on public.room_messages for insert with check (user_id = auth.uid());

-- notifications (private)
drop policy if exists notifications_read on public.notifications;
drop policy if exists notifications_update on public.notifications;
drop policy if exists notifications_write on public.notifications;
create policy notifications_read   on public.notifications for select using (user_id = auth.uid());
create policy notifications_update on public.notifications for update using (user_id = auth.uid());
-- anyone signed in may create a notification *for someone else* (e.g. "X liked your piece")
create policy notifications_write  on public.notifications for insert
  with check (auth.uid() is not null);

-- time capsules / sessions / dna (private, dna readable by all for public profiles)
drop policy if exists capsules_all on public.time_capsules;
create policy capsules_all on public.time_capsules for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists sessions_all on public.writing_sessions;
create policy sessions_all on public.writing_sessions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists dna_read on public.writing_dna;
drop policy if exists dna_write on public.writing_dna;
create policy dna_read  on public.writing_dna for select using (true);
create policy dna_write on public.writing_dna for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- AI chat (private)
drop policy if exists aiconv_all on public.ai_conversations;
create policy aiconv_all on public.ai_conversations for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists aimsg_all on public.ai_messages;
create policy aimsg_all on public.ai_messages for all
  using (exists (select 1 from public.ai_conversations c
                 where c.id = conversation_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.ai_conversations c
                 where c.id = conversation_id and c.user_id = auth.uid()));

-- ════════════════════════════════════════════════════════════════
--  Realtime — messages, room chat and notifications stream live
-- ════════════════════════════════════════════════════════════════
do $$
begin
  begin execute 'alter publication supabase_realtime add table public.messages'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.room_messages'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.notifications'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.room_participants'; exception when others then null; end;
end $$;

-- ════════════════════════════════════════════════════════════════
--  Convenience views (counts the UI needs)
-- ════════════════════════════════════════════════════════════════
create or replace view public.article_stats as
  select a.id as article_id,
         (select count(*) from public.likes     l where l.article_id = a.id) as likes,
         (select count(*) from public.comments  c where c.article_id = a.id) as comments,
         (select count(*) from public.bookmarks b where b.article_id = a.id) as bookmarks
  from public.articles a;
