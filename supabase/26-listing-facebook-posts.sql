-- Facebook publish history linked to listings (Page + group destinations).
-- Run after 19-facebook-groups.sql / 25-facebook-groups-defaults.sql.

alter table public.apartments
  add column if not exists last_facebook_posted_at timestamptz;

create index if not exists idx_apartments_last_facebook_posted
  on public.apartments (estate_company_id, last_facebook_posted_at)
  where last_facebook_posted_at is not null;

create table if not exists public.listing_facebook_posts (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references public.apartments(id) on delete cascade,
  estate_company_id uuid not null references public.estate_companies(id) on delete cascade,
  batch_id uuid not null,
  destination text not null check (destination in ('page', 'group')),
  facebook_group_id uuid references public.facebook_groups(id) on delete set null,
  group_name text,
  group_url text,
  facebook_post_id text,
  permalink text,
  photo_count int not null default 0
    check (photo_count >= 0),
  caption_preview text,
  posted_at timestamptz not null default now(),
  posted_by uuid references public.profiles(id) on delete set null,
  cleared_at timestamptz,
  created_at timestamptz not null default now(),
  constraint listing_facebook_posts_group_fields check (
    destination <> 'group'
    or group_url is not null
    or facebook_group_id is not null
    or group_name is not null
  )
);

create index if not exists idx_listing_fb_posts_apartment
  on public.listing_facebook_posts (apartment_id, posted_at desc)
  where cleared_at is null;

create index if not exists idx_listing_fb_posts_company
  on public.listing_facebook_posts (estate_company_id, posted_at desc)
  where cleared_at is null;

create index if not exists idx_listing_fb_posts_batch
  on public.listing_facebook_posts (batch_id);

alter table public.listing_facebook_posts enable row level security;

drop policy if exists "Partner read own listing facebook posts" on public.listing_facebook_posts;
drop policy if exists "Partner insert own listing facebook posts" on public.listing_facebook_posts;
drop policy if exists "Partner update own listing facebook posts" on public.listing_facebook_posts;
drop policy if exists "Partner delete own listing facebook posts" on public.listing_facebook_posts;

create policy "Partner read own listing facebook posts"
  on public.listing_facebook_posts for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = listing_facebook_posts.estate_company_id)
          or p.role = 'admin'
        )
    )
  );

create policy "Partner insert own listing facebook posts"
  on public.listing_facebook_posts for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = listing_facebook_posts.estate_company_id)
          or p.role = 'admin'
        )
    )
  );

create policy "Partner update own listing facebook posts"
  on public.listing_facebook_posts for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = listing_facebook_posts.estate_company_id)
          or p.role = 'admin'
        )
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = listing_facebook_posts.estate_company_id)
          or p.role = 'admin'
        )
    )
  );

create policy "Partner delete own listing facebook posts"
  on public.listing_facebook_posts for delete to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = listing_facebook_posts.estate_company_id)
          or p.role = 'admin'
        )
    )
  );

comment on table public.listing_facebook_posts is
  'History of Facebook Page/group publishes for a listing. Soft-clear via cleared_at.';
comment on column public.apartments.last_facebook_posted_at is
  'Denormalized max(posted_at) of active listing_facebook_posts for home feed nudges.';
