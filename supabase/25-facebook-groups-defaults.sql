-- Seed the three default Facebook groups shown in Partner Studio Promote overlay.
-- Safe to re-run. Run after supabase/19-facebook-groups.sql.

insert into public.facebook_groups (facebook_group_id, url, name, is_default_suggestion, meta)
values
  (
    '203559903815711',
    'https://www.facebook.com/groups/203559903815711',
    'Da Nang Housing',
    true,
    '{"source":"platform_default"}'::jsonb
  ),
  (
    '366245597210651',
    'https://www.facebook.com/groups/366245597210651',
    'Da Nang Apartments',
    true,
    '{"source":"platform_default"}'::jsonb
  )
on conflict (facebook_group_id) do update
  set
    url = excluded.url,
    name = excluded.name,
    is_default_suggestion = true,
    meta = public.facebook_groups.meta || excluded.meta;

-- Slug-based default (no numeric id yet)
insert into public.facebook_groups (facebook_group_id, url, name, is_default_suggestion, meta)
select
  null,
  'https://www.facebook.com/groups/danangexpatshouseapartment',
  'DA NANG EXPATS HOUSE — Apartment',
  true,
  '{"source":"platform_default"}'::jsonb
where not exists (
  select 1 from public.facebook_groups
  where lower(url) = lower('https://www.facebook.com/groups/danangexpatshouseapartment')
);
