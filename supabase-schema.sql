-- ============================================================
-- FinDash — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Profiles table — one row per user
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  finnhub_key   text,
  theme         text        default 'dark',
  sidebar_collapsed boolean default false,
  active_dashboard_id uuid,
  onboarding_completed boolean default false,
  portfolio_holdings  jsonb   default '[]'::jsonb,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 2. Dashboards table — many per user
create table if not exists public.dashboards (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null default 'Untitled Dashboard',
  widgets    jsonb default '[]'::jsonb,
  position   integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Enable Row Level Security
alter table public.profiles   enable row level security;
alter table public.dashboards enable row level security;

-- 4. RLS policies — each user can only touch their own rows
-- Profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Dashboards
create policy "Users can view own dashboards"
  on public.dashboards for select
  using (auth.uid() = user_id);

create policy "Users can insert own dashboards"
  on public.dashboards for insert
  with check (auth.uid() = user_id);

create policy "Users can update own dashboards"
  on public.dashboards for update
  using (auth.uid() = user_id);

create policy "Users can delete own dashboards"
  on public.dashboards for delete
  using (auth.uid() = user_id);

-- 5. Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger dashboards_updated_at
  before update on public.dashboards
  for each row execute function public.handle_updated_at();

-- 6. Index for fast dashboard lookups by user
create index if not exists dashboards_user_id_idx
  on public.dashboards(user_id);

-- 7. Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if present, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
