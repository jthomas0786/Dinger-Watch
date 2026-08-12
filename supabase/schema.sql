-- Run in Supabase SQL Editor before enabling public accounts.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  handle text unique check (char_length(handle) between 3 and 24),
  created_at timestamptz not null default now()
);

create table if not exists public.team_follows (
  user_id uuid not null references public.profiles on delete cascade,
  league text not null,
  team_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, league, team_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  league text not null,
  event_id text,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  league text not null,
  event_id text not null,
  selection text not null check (char_length(selection) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (user_id, league, event_id)
);

create table if not exists public.app_errors (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.team_follows enable row level security;
alter table public.posts enable row level security;
alter table public.predictions enable row level security;
alter table public.app_errors enable row level security;

create policy "public profiles readable" on public.profiles for select using (true);
create policy "users manage own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "users manage follows" on public.team_follows for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "posts readable" on public.posts for select using (true);
create policy "users create posts" on public.posts for insert with check (auth.uid() = user_id);
create policy "users update own posts" on public.posts for update using (auth.uid() = user_id);
create policy "users delete own posts" on public.posts for delete using (auth.uid() = user_id);
create policy "predictions readable" on public.predictions for select using (true);
create policy "users manage predictions" on public.predictions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
