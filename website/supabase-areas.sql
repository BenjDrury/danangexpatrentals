-- Run in Supabase SQL Editor: areas + apartment_types tables and seed data.
-- Public read for anon (website); restrict writes to dashboard/service later if needed.

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

-- Seed areas (current site content)
insert into public.areas (id, name, images, vibe, price_range, who) values
  ('an-thuong', 'An Thuong', ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'], 'Café strip, digital nomad hub, lots of Western food and coworking. Busy but walkable.', 'Studios from ~$280, 1BR from ~$350. Can go higher for prime spots.', 'Digital nomads, first-time Da Nang visitors, people who want everything in walking distance.'),
  ('my-khe', 'My Khe', ARRAY['https://images.unsplash.com/photo-1529290130-4ca3753253ae?w=800&q=80'], 'Beach-focused. Long stretch of sand, beachfront and near-beach buildings. More spread out.', '1BR from ~$400, 2BR from ~$600. Closer to sand = higher.', 'Beach lovers, long-term stays, families (2BR options). Quieter than An Thuong.'),
  ('my-an', 'My An', ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80'], 'Quieter streets, still near cafes and beach. Good value, less touristy.', 'Studios and 1BR typically $320–500/month.', 'People who want balance: not too busy, not too far. Good for 6+ month stays.'),
  ('other', 'Quieter local areas', ARRAY['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80'], 'Further from the main expat strips. More local, lower prices, less English on the street.', 'Often $250–400 for studios/1BR. Depends on exact location.', 'Budget-conscious, people who don’t need the expat bubble, long-term.')
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

-- Seed apartment types (order by sort_order)
insert into public.apartment_types (title, "desc", sort_order) values
  ('Studios under $350', 'Compact, often in An Thuong or near the beach. Good for solo remote workers.', 1),
  ('1BR near beach', 'My Khe and nearby. Walking distance to sand and cafes. Typically $400–600/month.', 2),
  ('Serviced apartments', 'Cleaning included, flexible terms. Ideal for short stays or less hassle.', 3),
  ('Long-term rentals', '6–12 month leases. Better rates and more choice when you commit longer.', 4),
  ('Short-term options', '1–3 months. We can find monthly rentals and serviced options.', 5)
on conflict (title) do update set "desc" = excluded."desc", sort_order = excluded.sort_order;
