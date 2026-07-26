-- Partner applications: public form submissions from agents / owners.

create table if not exists public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  whatsapp text not null,
  company_name text,
  role text,
  areas text,
  inventory_note text,
  facebook_page text,
  source text not null default 'website'
);

alter table public.partner_applications enable row level security;

create policy "Allow anonymous insert partner applications"
  on public.partner_applications
  for insert
  to anon
  with check (true);

create policy "Allow authenticated read partner applications"
  on public.partner_applications
  for select
  to authenticated
  using (true);
