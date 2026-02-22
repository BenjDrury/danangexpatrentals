-- Run in Supabase SQL Editor after 01-leads.
-- Areas, apartment types (cards), and apartments (listings). Seed = former app fallback data.

-- ========== AREAS ==========
create table if not exists public.areas (
  id text primary key,
  name text not null,
  images text[] not null default '{}',
  vibe text not null,
  price_range text not null,
  who text not null,
  created_at timestamptz not null default now()
);

alter table public.areas enable row level security;

create policy "Allow public read areas"
  on public.areas for select to anon using (true);

-- Seed areas (dummy data from app; images = local /public assets)
insert into public.areas (id, name, images, vibe, price_range, who) values
  ('an-thuong', 'An Thuong', ARRAY['/danang-dragon-bridge.jpg'], 'Café strip, digital nomad hub, lots of Western food and coworking. Busy but walkable.', 'Studios from ~$280, 1BR from ~$350. Can go higher for prime spots.', 'Digital nomads, first-time Da Nang visitors, people who want everything in walking distance.'),
  ('my-khe', 'My Khe', ARRAY['/danang-my-khe.jpg'], 'Beach-focused. Long stretch of sand, beachfront and near-beach buildings. More spread out.', '1BR from ~$400, 2BR from ~$600. Closer to sand = higher.', 'Beach lovers, long-term stays, families (2BR options). Quieter than An Thuong.'),
  ('my-an', 'My An', ARRAY['/danang-hands.jpg'], 'Quieter streets, still near cafes and beach. Good value, less touristy.', 'Studios and 1BR typically $320–500/month.', 'People who want balance: not too busy, not too far. Good for 6+ month stays.'),
  ('other', 'Quieter local areas', ARRAY['/danang-bana-hills.jpg'], 'Further from the main expat strips. More local, lower prices, less English on the street.', 'Often $250–400 for studios/1BR. Depends on exact location.', 'Budget-conscious, people who don''t need the expat bubble, long-term.')
on conflict (id) do update set
  name = excluded.name,
  images = excluded.images,
  vibe = excluded.vibe,
  price_range = excluded.price_range,
  who = excluded.who;

-- ========== APARTMENT TYPES (what we help you find) ==========
create table if not exists public.apartment_types (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  "desc" text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.apartment_types enable row level security;

create policy "Allow public read apartment_types"
  on public.apartment_types for select to anon using (true);

-- Seed apartment types (dummy data from app)
insert into public.apartment_types (title, "desc", sort_order) values
  ('Studios under $350', 'Compact, often in An Thuong or near the beach. Good for solo remote workers.', 1),
  ('1BR near beach', 'My Khe and nearby. Walking distance to sand and cafes. Typically $400–600/month.', 2),
  ('Serviced apartments', 'Cleaning included, flexible terms. Ideal for short stays or less hassle.', 3),
  ('Long-term rentals', '6–12 month leases. Better rates and more choice when you commit longer.', 4),
  ('Short-term options', '1–3 months. We can find monthly rentals and serviced options.', 5)
on conflict (title) do update set "desc" = excluded."desc", sort_order = excluded.sort_order;

-- ========== APARTMENTS (listings, reference area) ==========
create table if not exists public.apartments (
  id uuid primary key default gen_random_uuid(),
  area_id text not null references public.areas(id) on delete restrict,
  title text not null,
  description text,
  price int not null,
  price_display text not null,
  main_image text not null,
  images text[] not null default '{}',
  bedrooms int not null,
  bathrooms int,
  size_sqm int,
  features text[] not null default '{}',
  available_from date,
  min_lease_months int,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_apartments_area_id on public.apartments(area_id);
create index if not exists idx_apartments_price on public.apartments(price);
create index if not exists idx_apartments_sort on public.apartments(sort_order, created_at desc);

alter table public.apartments enable row level security;

create policy "Allow public read apartments"
  on public.apartments for select to anon using (true);
