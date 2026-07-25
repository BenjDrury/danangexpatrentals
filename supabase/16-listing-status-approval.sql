-- Listing status workflow: draft → pending_review → available (admin approve).
-- Partners cannot set status to available; available_from already exists (02).
-- Default for NEW rows = draft. Existing available listings stay available.

-- Drop existing status check (name may vary; Postgres auto-names table_column_check)
do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.apartments'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%status%';

  if cname is not null then
    execute format('alter table public.apartments drop constraint %I', cname);
  end if;
end $$;

alter table public.apartments
  alter column status set default 'draft';

alter table public.apartments
  add constraint apartments_status_check
  check (status in ('draft', 'pending_review', 'available', 'reserved', 'rented'));

-- When partner requested go-live; optional reject note from admin
alter table public.apartments
  add column if not exists live_requested_at timestamptz,
  add column if not exists live_rejection_note text;

comment on column public.apartments.status is
  'Lifecycle: draft → pending_review (partner request) → available (admin) | reserved | rented.';
comment on column public.apartments.available_from is
  'Date the unit becomes available to move in (nullable).';
comment on column public.apartments.live_requested_at is
  'When partner last requested admin approval to set the listing live.';
comment on column public.apartments.live_rejection_note is
  'Optional admin note when rejecting a go-live request (status back to draft).';

create index if not exists idx_apartments_pending_review
  on public.apartments (live_requested_at desc nulls last)
  where status = 'pending_review';

-- Prevent partners from setting status TO available via direct API/RLS updates.
-- Admins may set any status. Confirming validity on an already-available row is fine
-- (UPDATE does not change NEW.status to available from a non-available OLD).
create or replace function public.apartments_partner_cannot_set_available()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
begin
  select p.role into caller_role
  from public.profiles p
  where p.id = auth.uid();

  -- service role / no jwt: allow (admin scripts, server with service key)
  if auth.uid() is null then
    return new;
  end if;

  if caller_role = 'admin' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status = 'available' and caller_role is distinct from 'admin' then
      raise exception 'Partners cannot create listings as available; use draft'
        using errcode = '42501';
    end if;
    return new;
  end if;

  -- UPDATE: partner cannot transition TO available
  if new.status = 'available'
     and (old.status is distinct from 'available') then
    raise exception 'Partners cannot set listing status to available; request pending_review instead'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_apartments_partner_cannot_set_available on public.apartments;
create trigger trg_apartments_partner_cannot_set_available
  before insert or update of status on public.apartments
  for each row
  execute function public.apartments_partner_cannot_set_available();
