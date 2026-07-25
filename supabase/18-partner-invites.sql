-- Partner team invites: multiple users per estate company.
-- Run after 12-partner-portal.sql (profiles.estate_company_id already exists).
-- Accept flow uses service role in Partner Studio (profiles have no self-update policy).

-- ========== PARTNER INVITES ==========
create table if not exists public.partner_invites (
  id uuid primary key default gen_random_uuid(),
  estate_company_id uuid not null references public.estate_companies(id) on delete cascade,
  email text not null,
  invited_by uuid references public.profiles(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked')),
  token text not null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint partner_invites_email_nonempty check (length(trim(email)) > 0),
  constraint partner_invites_token_nonempty check (length(trim(token)) > 0)
);

create unique index if not exists idx_partner_invites_token
  on public.partner_invites (token);

create index if not exists idx_partner_invites_company
  on public.partner_invites (estate_company_id);

create index if not exists idx_partner_invites_company_status
  on public.partner_invites (estate_company_id, status);

-- One pending invite per company + email (case-insensitive)
create unique index if not exists idx_partner_invites_pending_email
  on public.partner_invites (estate_company_id, lower(email))
  where status = 'pending';

alter table public.partner_invites enable row level security;

drop policy if exists "Partner read company invites" on public.partner_invites;
drop policy if exists "Partner insert company invites" on public.partner_invites;
drop policy if exists "Partner update company invites" on public.partner_invites;

-- Partners see invites for their company; admins see all.
create policy "Partner read company invites"
  on public.partner_invites for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = partner_invites.estate_company_id)
          or p.role = 'admin'
        )
    )
  );

create policy "Partner insert company invites"
  on public.partner_invites for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = partner_invites.estate_company_id)
          or p.role = 'admin'
        )
    )
  );

-- Revoke / status updates (accept is typically done via service role).
create policy "Partner update company invites"
  on public.partner_invites for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = partner_invites.estate_company_id)
          or p.role = 'admin'
        )
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'partner' and p.estate_company_id = partner_invites.estate_company_id)
          or p.role = 'admin'
        )
    )
  );

comment on table public.partner_invites is
  'Email invites to join a partner estate company. Accept via /invite/[token] using service role.';
