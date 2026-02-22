-- Run in Supabase SQL Editor after 02-areas-apartments.
-- User profiles with role for admin-website. No fallback data; add admins manually.
--
-- How to add an admin:
-- 1. Supabase Dashboard → Authentication → Users → Add user (email + password).
-- 2. Copy the user's UUID.
-- 3. Run: insert into public.profiles (id, role) values ('<uuid>', 'admin');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

comment on table public.profiles is 'User roles. Add admin rows manually after creating user in Auth.';
