-- Partner portal: realtor accounts, listing status, contacts, deals, post drafts.
-- Run in Supabase SQL Editor after estate_companies (10) exist.

-- ========== PROFILES: partner role + company link ==========
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'admin', 'partner'));

alter table public.profiles
  add column if not exists estate_company_id uuid references public.estate_companies(id) on delete set null;

alter table public.profiles
  add column if not exists display_name text;

create index if not exists idx_profiles_estate_company
  on public.profiles (estate_company_id);

-- ========== ESTATE COMPANIES: partner-facing fields ==========
alter table public.estate_companies
  add column if not exists contact_phone text,
  add column if not exists contact_whatsapp text,
  add column if not exists contact_email text,
  add column if not exists notes text;

-- Allow authenticated partners/admins to update their company (policies below)
drop policy if exists "Allow admin write estate_companies" on public.estate_companies;
drop policy if exists "Allow partner read estate_companies" on public.estate_companies;
drop policy if exists "Allow partner update own estate_company" on public.estate_companies;
drop policy if exists "Allow admin all estate_companies" on public.estate_companies;
drop policy if exists "Allow authenticated read estate_companies" on public.estate_companies;
drop policy if exists "Allow admin insert estate_companies" on public.estate_companies;
drop policy if exists "Allow admin update estate_companies" on public.estate_companies;

create policy "Allow authenticated read estate_companies"
  on public.estate_companies for select to authenticated
  using (true);

create policy "Allow admin insert estate_companies"
  on public.estate_companies for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Allow admin update estate_companies"
  on public.estate_companies for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Allow partner update own estate_company"
  on public.estate_companies for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'partner'
        and p.estate_company_id = estate_companies.id
    )
  );

-- ========== APARTMENTS: listing lifecycle ==========
alter table public.apartments
  add column if not exists status text not null default 'available'
    check (status in ('draft', 'available', 'reserved', 'rented')),
  add column if not exists video_urls text[] not null default '{}',
  add column if not exists partner_notes text,
  add column if not exists last_bumped_at timestamptz,
  add column if not exists public_slug text;

create unique index if not exists idx_apartments_public_slug
  on public.apartments (public_slug)
  where public_slug is not null;

create index if not exists idx_apartments_estate_status
  on public.apartments (estate_company_id, status);

-- Partner / admin write policies for apartments
drop policy if exists "Allow partner insert apartments" on public.apartments;
drop policy if exists "Allow partner update own apartments" on public.apartments;
drop policy if exists "Allow partner delete own apartments" on public.apartments;
drop policy if exists "Allow admin insert apartments" on public.apartments;
drop policy if exists "Allow admin update apartments" on public.apartments;
drop policy if exists "Allow admin delete apartments" on public.apartments;

create policy "Allow partner insert apartments"
  on public.apartments for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'partner'
        and p.estate_company_id is not null
        and p.estate_company_id = apartments.estate_company_id
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Allow partner update own apartments"
  on public.apartments for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'partner'
        and p.estate_company_id = apartments.estate_company_id
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Allow partner delete own apartments"
  on public.apartments for delete to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'partner'
        and p.estate_company_id = apartments.estate_company_id
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Public site: only show available (and maybe reserved) — handled in app queries;
-- keep anon select as-is for now.

-- ========== PARTNER CONTACTS ==========
create table if not exists public.partner_contacts (
  id uuid primary key default gen_random_uuid(),
  estate_company_id uuid not null references public.estate_companies(id) on delete cascade,
  name text not null,
  phone text,
  whatsapp text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_partner_contacts_company
  on public.partner_contacts (estate_company_id);

alter table public.partner_contacts enable row level security;

drop policy if exists "Partner read own contacts" on public.partner_contacts;
drop policy if exists "Partner write own contacts" on public.partner_contacts;

create policy "Partner read own contacts"
  on public.partner_contacts for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = partner_contacts.estate_company_id)
          or p.role = 'admin'
        )
    )
  );

create policy "Partner write own contacts"
  on public.partner_contacts for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = partner_contacts.estate_company_id)
          or p.role = 'admin'
        )
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = partner_contacts.estate_company_id)
          or p.role = 'admin'
        )
    )
  );

-- ========== PARTNER DEALS (commission tracking) ==========
create table if not exists public.partner_deals (
  id uuid primary key default gen_random_uuid(),
  estate_company_id uuid not null references public.estate_companies(id) on delete cascade,
  apartment_id uuid references public.apartments(id) on delete set null,
  contact_id uuid references public.partner_contacts(id) on delete set null,
  stage text not null default 'inquiry'
    check (stage in ('inquiry', 'viewing', 'negotiation', 'won', 'lost')),
  expected_commission_usd numeric,
  expected_commission_pct numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_partner_deals_company
  on public.partner_deals (estate_company_id);

alter table public.partner_deals enable row level security;

drop policy if exists "Partner rw own deals" on public.partner_deals;

create policy "Partner rw own deals"
  on public.partner_deals for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = partner_deals.estate_company_id)
          or p.role = 'admin'
        )
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = partner_deals.estate_company_id)
          or p.role = 'admin'
        )
    )
  );

-- ========== POST DRAFTS ==========
create table if not exists public.listing_post_drafts (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references public.apartments(id) on delete cascade,
  estate_company_id uuid not null references public.estate_companies(id) on delete cascade,
  caption text not null default '',
  status text not null default 'draft' check (status in ('draft', 'ready', 'posted')),
  scheduled_for timestamptz,
  last_posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_listing_post_drafts_apt
  on public.listing_post_drafts (apartment_id);

alter table public.listing_post_drafts enable row level security;

drop policy if exists "Partner rw own post drafts" on public.listing_post_drafts;

create policy "Partner rw own post drafts"
  on public.listing_post_drafts for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = listing_post_drafts.estate_company_id)
          or p.role = 'admin'
        )
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = listing_post_drafts.estate_company_id)
          or p.role = 'admin'
        )
    )
  );

-- ========== STORAGE: apartment media ==========
insert into storage.buckets (id, name, public)
values ('apartments', 'apartments', true)
on conflict (id) do nothing;

drop policy if exists "Public read apartment media" on storage.objects;
drop policy if exists "Partner upload apartment media" on storage.objects;
drop policy if exists "Partner update apartment media" on storage.objects;
drop policy if exists "Partner delete apartment media" on storage.objects;

create policy "Public read apartment media"
  on storage.objects for select
  using (bucket_id = 'apartments');

create policy "Partner upload apartment media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'apartments'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('partner', 'admin')
    )
  );

create policy "Partner update apartment media"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'apartments'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('partner', 'admin')
    )
  );

create policy "Partner delete apartment media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'apartments'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('partner', 'admin')
    )
  );

comment on table public.partner_contacts is 'CRM contacts for partner estate companies';
comment on table public.partner_deals is 'Deal pipeline + expected commission for partners';
comment on table public.listing_post_drafts is 'Facebook/social post drafts generated in partner studio';

-- ========== MAKE A PARTNER USER ==========
-- After creating the auth user in Supabase Auth:
--   update public.profiles
--   set role = 'partner',
--       estate_company_id = '<estate_companies.id>',
--       display_name = 'Optional name'
--   where id = '<auth.users.id>';
-- Or from repo root: npm run make-partner -- <user-uuid> <estate-company-id> [display-name]
-- Or invite via Partner Studio → Settings → Team (/invite/[token]).
