-- Run in Supabase SQL Editor. Order: run 01-leads first, then 02-*, then 03-*.
-- Leads: contact form submissions.

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

alter table public.leads enable row level security;

create policy "Allow anonymous insert"
  on public.leads
  for insert
  to anon
  with check (true);
