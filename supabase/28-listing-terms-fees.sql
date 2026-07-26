-- Listing terms & fees: help renters decide if a listing is worth contacting.
-- min_lease_months already exists (02); partners could not enter it until form wiring.

alter table public.apartments
  add column if not exists property_type text,
  add column if not exists deposit_months numeric,
  add column if not exists agency_fee_months numeric,
  add column if not exists utilities_included text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.apartments'::regclass
      and conname = 'apartments_property_type_check'
  ) then
    alter table public.apartments
      add constraint apartments_property_type_check
      check (
        property_type is null
        or property_type in ('apartment', 'house', 'villa', 'serviced')
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.apartments'::regclass
      and conname = 'apartments_utilities_included_check'
  ) then
    alter table public.apartments
      add constraint apartments_utilities_included_check
      check (
        utilities_included is null
        or utilities_included in ('not_included', 'partial', 'included')
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.apartments'::regclass
      and conname = 'apartments_deposit_months_check'
  ) then
    alter table public.apartments
      add constraint apartments_deposit_months_check
      check (deposit_months is null or deposit_months >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.apartments'::regclass
      and conname = 'apartments_agency_fee_months_check'
  ) then
    alter table public.apartments
      add constraint apartments_agency_fee_months_check
      check (agency_fee_months is null or agency_fee_months >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.apartments'::regclass
      and conname = 'apartments_min_lease_months_check'
  ) then
    alter table public.apartments
      add constraint apartments_min_lease_months_check
      check (min_lease_months is null or min_lease_months >= 0);
  end if;
end $$;

comment on column public.apartments.property_type is
  'Home type: apartment, house, villa, or serviced. Null = unspecified.';
comment on column public.apartments.min_lease_months is
  'Minimum lease length in months. Null = unspecified / flexible.';
comment on column public.apartments.deposit_months is
  'Security deposit as months of rent (e.g. 1, 2). Null = unspecified.';
comment on column public.apartments.agency_fee_months is
  'Tenant-facing agency/service fee as months of rent (0 = none). Null = unspecified.';
comment on column public.apartments.utilities_included is
  'Whether utilities are in the rent: not_included, partial, included. Null = unspecified.';
