-- Listing validity confirmation for Partner Studio Home task feed.
-- Partners confirm availability periodically; stale listings drop from the public site.

alter table public.apartments
  add column if not exists last_validity_check timestamptz;

-- Existing rows: seed from bump / update / create so they aren't all "never checked".
update public.apartments
set last_validity_check = coalesce(last_bumped_at, updated_at, created_at, now())
where last_validity_check is null;

create index if not exists idx_apartments_last_validity_check
  on public.apartments (last_validity_check);

comment on column public.apartments.last_validity_check is
  'When a partner last confirmed this listing is still valid. Null = never checked.';
