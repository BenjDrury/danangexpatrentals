-- Link contact-form leads to a specific listing / area when the inquiry
-- came from an apartment or neighbourhood page. No FK so a stale or
-- mistyped id never blocks lead capture.

alter table public.leads
  add column if not exists apartment_id uuid,
  add column if not exists area_id text;

create index if not exists leads_apartment_id_idx on public.leads (apartment_id);
create index if not exists leads_area_id_idx on public.leads (area_id);
