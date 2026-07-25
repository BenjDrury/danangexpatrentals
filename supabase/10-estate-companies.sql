-- Run after 02-areas-apartments (and 06-admin-only-write if you use admin writes).
-- Estate companies (e.g. Facebook page profiles) and link from apartments.

-- ========== ESTATE COMPANIES ==========
create table if not exists public.estate_companies (
  id uuid primary key default gen_random_uuid(),
  facebook_id text not null unique,
  name text not null,
  page_url text,
  logo_url text,
  page_followers int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_estate_companies_facebook_id on public.estate_companies(facebook_id);

alter table public.estate_companies enable row level security;

create policy "Allow public read estate_companies"
  on public.estate_companies for select to anon using (true);

-- ========== APARTMENTS: add estate company + source fields ==========
alter table public.apartments
  add column if not exists estate_company_id uuid references public.estate_companies(id) on delete set null,
  add column if not exists source_url text,
  add column if not exists source_post_id text;

create index if not exists idx_apartments_estate_company_id on public.apartments(estate_company_id);
create unique index if not exists idx_apartments_source_post_id on public.apartments(source_post_id) where source_post_id is not null;
create unique index if not exists idx_apartments_source_url on public.apartments(source_url) where source_url is not null;
