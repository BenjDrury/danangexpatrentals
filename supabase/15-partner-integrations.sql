-- Partner Studio integrations (Facebook Page connect for future auto-post).
-- Tokens live in a restricted secrets table (service role only).
-- Partners/admins can read connection status on estate_company_integrations.

-- ========== STATUS TABLE (safe for partner SELECT) ==========
create table if not exists public.estate_company_integrations (
  id uuid primary key default gen_random_uuid(),
  estate_company_id uuid not null references public.estate_companies(id) on delete cascade,
  provider text not null check (provider in ('facebook')),
  status text not null default 'disconnected'
    check (status in ('connected', 'disconnected')),
  external_account_id text,
  external_account_name text,
  meta jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (estate_company_id, provider)
);

create index if not exists idx_estate_company_integrations_company
  on public.estate_company_integrations (estate_company_id);

alter table public.estate_company_integrations enable row level security;

drop policy if exists "Partner read own integrations" on public.estate_company_integrations;
drop policy if exists "Partner update own integrations" on public.estate_company_integrations;
drop policy if exists "Partner insert own integrations" on public.estate_company_integrations;

-- Partners see their company; admins see all (including when impersonating via app).
create policy "Partner read own integrations"
  on public.estate_company_integrations for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = estate_company_integrations.estate_company_id)
          or p.role = 'admin'
        )
    )
  );

-- Disconnect / status updates from the studio (token clears go through service role).
create policy "Partner update own integrations"
  on public.estate_company_integrations for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = estate_company_integrations.estate_company_id)
          or p.role = 'admin'
        )
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = estate_company_integrations.estate_company_id)
          or p.role = 'admin'
        )
    )
  );

create policy "Partner insert own integrations"
  on public.estate_company_integrations for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = estate_company_integrations.estate_company_id)
          or p.role = 'admin'
        )
    )
  );

-- ========== SECRETS (no authenticated policies → denied; service role bypasses RLS) ==========
create table if not exists public.estate_company_integration_secrets (
  integration_id uuid primary key
    references public.estate_company_integrations(id) on delete cascade,
  access_token text not null,
  token_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.estate_company_integration_secrets enable row level security;
-- Intentionally no policies for authenticated/anon: only service_role can read/write tokens.

comment on table public.estate_company_integrations is
  'Partner integration connection status (Facebook Page, etc.). No raw tokens.';
comment on table public.estate_company_integration_secrets is
  'OAuth tokens for integrations. Service role only — never expose via PostgREST to clients.';
