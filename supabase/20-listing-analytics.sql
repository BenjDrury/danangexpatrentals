-- Run in Supabase SQL Editor after 19-*.
-- Listing pageview analytics: total views + all-time unique visitors.

alter table public.apartments
  add column if not exists view_count int not null default 0,
  add column if not exists unique_view_count int not null default 0;

create table if not exists public.listing_visitors (
  apartment_id uuid not null references public.apartments(id) on delete cascade,
  visitor_id uuid not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (apartment_id, visitor_id)
);

create index if not exists idx_listing_visitors_apartment
  on public.listing_visitors (apartment_id);

alter table public.listing_visitors enable row level security;

-- No direct anon/authenticated write policies — only the RPC below inserts/updates.
-- Partners/admins read counters via existing apartments select policies.

create or replace function public.record_listing_view(
  p_apartment_id uuid,
  p_visitor_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_apartment_id is null or p_visitor_id is null then
    return;
  end if;

  update public.apartments
  set view_count = view_count + 1
  where id = p_apartment_id;

  if not found then
    return;
  end if;

  insert into public.listing_visitors (apartment_id, visitor_id)
  values (p_apartment_id, p_visitor_id)
  on conflict (apartment_id, visitor_id) do nothing;

  if found then
    update public.apartments
    set unique_view_count = unique_view_count + 1
    where id = p_apartment_id;
  else
    update public.listing_visitors
    set last_seen_at = now()
    where apartment_id = p_apartment_id
      and visitor_id = p_visitor_id;
  end if;
end;
$$;

revoke all on function public.record_listing_view(uuid, uuid) from public;
grant execute on function public.record_listing_view(uuid, uuid) to anon, authenticated;
