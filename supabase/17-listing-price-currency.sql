-- Listing price currency: partners enter VND or USD; store both for display/filter.
-- Does not touch status / available_from / approval workflow (see 16).

-- ========== FX rate (single-row settings) ==========
create table if not exists public.app_settings (
  id text primary key default 'default' check (id = 'default'),
  usd_vnd_rate numeric not null default 25400
    check (usd_vnd_rate > 0),
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id, usd_vnd_rate)
values ('default', 25400)
on conflict (id) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "Allow public read app_settings" on public.app_settings;
create policy "Allow public read app_settings"
  on public.app_settings for select to anon, authenticated
  using (true);

drop policy if exists "Admin update app_settings" on public.app_settings;
create policy "Admin update app_settings"
  on public.app_settings for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

comment on table public.app_settings is
  'App-wide settings. usd_vnd_rate used to convert listing prices (override with FX_USD_VND env).';

-- ========== Apartment price fields ==========
alter table public.apartments
  add column if not exists price_amount numeric,
  add column if not exists price_currency text,
  add column if not exists price_usd numeric,
  add column if not exists price_vnd numeric;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.apartments'::regclass
      and conname = 'apartments_price_currency_check'
  ) then
    alter table public.apartments
      add constraint apartments_price_currency_check
      check (price_currency is null or price_currency in ('USD', 'VND'));
  end if;
end $$;

-- Backfill from legacy `price` (treated as USD)
update public.apartments a
set
  price_amount = coalesce(a.price_amount, a.price::numeric),
  price_currency = coalesce(a.price_currency, 'USD'),
  price_usd = coalesce(a.price_usd, a.price::numeric),
  price_vnd = coalesce(a.price_vnd, round(a.price::numeric * s.usd_vnd_rate))
from public.app_settings s
where s.id = 'default'
  and (
    a.price_amount is null
    or a.price_currency is null
    or a.price_usd is null
    or a.price_vnd is null
  );

-- Refresh dual display when missing VND glyph or middle dot
update public.apartments
set price_display =
  '$' || to_char(price_usd, 'FM999999999')
  || ' · '
  || replace(to_char(price_vnd, 'FM999,999,999,999'), ',', '.')
  || '₫'
where price_usd is not null
  and price_vnd is not null
  and (price_display is null or price_display not like '%₫%' or price_display not like '%·%');

comment on column public.apartments.price is
  'Legacy USD filter/sort column; kept in sync with price_usd.';
comment on column public.apartments.price_display is
  'Synced dual-currency display string e.g. "$800 · 20.320.000₫".';
comment on column public.apartments.price_amount is
  'Numeric amount as entered by the partner.';
comment on column public.apartments.price_currency is
  'Currency of price_amount: USD or VND.';
comment on column public.apartments.price_usd is
  'USD equivalent computed at save time (for filtering).';
comment on column public.apartments.price_vnd is
  'VND equivalent computed at save time.';

create index if not exists idx_apartments_price_usd on public.apartments (price_usd);
create index if not exists idx_apartments_price_vnd on public.apartments (price_vnd);
