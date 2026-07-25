-- Coworking + activity registries for the Living guide.
-- Run in Supabase SQL Editor after areas exist (02+).

-- ========== COWORKING SPACES ==========
create table if not exists public.coworking_spaces (
  id text primary key,
  name text not null,
  area_id text references public.areas(id) on delete set null,
  neighbourhood_label text,
  description text not null default '',
  address text,
  day_pass_usd numeric,
  monthly_usd numeric,
  price_note text,
  wifi_note text,
  best_for text,
  website_url text,
  maps_url text,
  images text[] not null default '{}',
  tags text[] not null default '{}',
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_coworking_published_sort
  on public.coworking_spaces (published, sort_order, name);

alter table public.coworking_spaces enable row level security;

drop policy if exists "Allow public read coworking_spaces" on public.coworking_spaces;
create policy "Allow public read coworking_spaces"
  on public.coworking_spaces for select to anon
  using (published = true);

drop policy if exists "Allow admin insert coworking_spaces" on public.coworking_spaces;
drop policy if exists "Allow admin update coworking_spaces" on public.coworking_spaces;
drop policy if exists "Allow admin delete coworking_spaces" on public.coworking_spaces;

create policy "Allow admin insert coworking_spaces"
  on public.coworking_spaces for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Allow admin update coworking_spaces"
  on public.coworking_spaces for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Allow admin delete coworking_spaces"
  on public.coworking_spaces for delete to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ========== ACTIVITIES ==========
create table if not exists public.activities (
  id text primary key,
  name text not null,
  category text not null default 'general',
  area_id text references public.areas(id) on delete set null,
  neighbourhood_label text,
  description text not null default '',
  typical_price_usd numeric,
  price_note text,
  duration_note text,
  website_url text,
  maps_url text,
  booking_url text,
  images text[] not null default '{}',
  tags text[] not null default '{}',
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_activities_published_sort
  on public.activities (published, sort_order, name);
create index if not exists idx_activities_category
  on public.activities (category);

alter table public.activities enable row level security;

drop policy if exists "Allow public read activities" on public.activities;
create policy "Allow public read activities"
  on public.activities for select to anon
  using (published = true);

drop policy if exists "Allow admin insert activities" on public.activities;
drop policy if exists "Allow admin update activities" on public.activities;
drop policy if exists "Allow admin delete activities" on public.activities;

create policy "Allow admin insert activities"
  on public.activities for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Allow admin update activities"
  on public.activities for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Allow admin delete activities"
  on public.activities for delete to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ========== SEED ==========
-- Real Da Nang venues live in supabase/13-coworking-activities-seed.sql
-- (upsert-safe). Run 11 first, then 13 in the SQL Editor — or via scripts with SUPABASE_DB_URI.
