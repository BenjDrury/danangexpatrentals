-- Run this in Supabase SQL Editor to create the leads table.
-- Enable RLS if you want; for MVP, anon insert is fine if you restrict anon key usage.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  budget_range text,
  move_date text,
  length_of_stay text,
  preferred_area text,
  whatsapp text not null,
  email text,
  source text not null default 'website'
);

-- Allow anonymous inserts (your Next.js app uses the anon key).
alter table public.leads enable row level security;

create policy "Allow anonymous insert"
  on public.leads
  for insert
  to anon
  with check (true);

-- Optional: only allow your backend or authenticated users to read.
-- create policy "Allow service role to read"
--   on public.leads for select to service_role using (true);
