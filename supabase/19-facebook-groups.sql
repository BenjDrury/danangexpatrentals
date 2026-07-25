-- Facebook groups catalog + per-company group selections for Partner Studio posting.
-- Run after estate_companies (10) and partner portal (12).

-- ========== GLOBAL CATALOG ==========
create table if not exists public.facebook_groups (
  id uuid primary key default gen_random_uuid(),
  facebook_group_id text unique,
  url text not null,
  name text not null,
  member_count int,
  subscriber_count int,
  activity_level text,
  posts_per_day numeric,
  last_scraped_at timestamptz,
  is_default_suggestion boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint facebook_groups_url_nonempty check (length(trim(url)) > 0),
  constraint facebook_groups_name_nonempty check (length(trim(name)) > 0)
);

create unique index if not exists idx_facebook_groups_url_lower
  on public.facebook_groups (lower(url));

create index if not exists idx_facebook_groups_default
  on public.facebook_groups (is_default_suggestion)
  where is_default_suggestion = true;

alter table public.facebook_groups enable row level security;

drop policy if exists "Authenticated read facebook_groups" on public.facebook_groups;
drop policy if exists "Partner insert facebook_groups" on public.facebook_groups;
drop policy if exists "Admin update facebook_groups" on public.facebook_groups;

create policy "Authenticated read facebook_groups"
  on public.facebook_groups for select to authenticated
  using (true);

-- Partners may upsert minimal catalog rows when adding their own group links.
create policy "Partner insert facebook_groups"
  on public.facebook_groups for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('partner', 'admin')
    )
  );

create policy "Admin update facebook_groups"
  on public.facebook_groups for update to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ========== COMPANY SELECTIONS ==========
create table if not exists public.estate_company_facebook_groups (
  id uuid primary key default gen_random_uuid(),
  estate_company_id uuid not null references public.estate_companies(id) on delete cascade,
  facebook_group_id uuid not null references public.facebook_groups(id) on delete cascade,
  source text not null default 'manual'
    check (source in ('catalog', 'manual')),
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (estate_company_id, facebook_group_id)
);

create index if not exists idx_ecfg_company
  on public.estate_company_facebook_groups (estate_company_id);

alter table public.estate_company_facebook_groups enable row level security;

drop policy if exists "Partner read company facebook groups" on public.estate_company_facebook_groups;
drop policy if exists "Partner insert company facebook groups" on public.estate_company_facebook_groups;
drop policy if exists "Partner delete company facebook groups" on public.estate_company_facebook_groups;

create policy "Partner read company facebook groups"
  on public.estate_company_facebook_groups for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = estate_company_facebook_groups.estate_company_id)
          or p.role = 'admin'
        )
    )
  );

create policy "Partner insert company facebook groups"
  on public.estate_company_facebook_groups for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = estate_company_facebook_groups.estate_company_id)
          or p.role = 'admin'
        )
    )
  );

create policy "Partner delete company facebook groups"
  on public.estate_company_facebook_groups for delete to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = estate_company_facebook_groups.estate_company_id)
          or p.role = 'admin'
        )
    )
  );

comment on table public.facebook_groups is
  'Global Facebook group catalog (activity/member stats for partner posting suggestions).';
comment on table public.estate_company_facebook_groups is
  'Groups a partner company selected from catalog or added manually by URL.';
