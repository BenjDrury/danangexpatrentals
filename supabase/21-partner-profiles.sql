-- Partner personal profiles: avatar + contact details for studio + optional public site.
-- Run after 12-partner-portal.sql (profiles.display_name / estate_company_id exist).

-- ========== PROFILE CONTACT FIELDS ==========
alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists phone text,
  add column if not exists whatsapp text,
  add column if not exists contact_email text,
  add column if not exists bio text;

comment on column public.profiles.avatar_url is
  'Public URL of the partner avatar (storage bucket avatars).';
comment on column public.profiles.phone is
  'Partner phone number shown to clients when enabled.';
comment on column public.profiles.whatsapp is
  'Partner WhatsApp number or link for client contact.';
comment on column public.profiles.contact_email is
  'Public contact email (may differ from auth email).';
comment on column public.profiles.bio is
  'Short bio for public agent cards.';

-- ========== RLS: update own row (select stays own-row; team list uses service role) ==========
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Lock role / company link for non-admin JWT callers (service role has no uid).
create or replace function public.profiles_lock_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
begin
  if auth.uid() is null then
    return new;
  end if;

  select p.role into caller_role
  from public.profiles p
  where p.id = auth.uid();

  if caller_role = 'admin' then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Cannot change profile role'
      using errcode = '42501';
  end if;

  if new.estate_company_id is distinct from old.estate_company_id then
    raise exception 'Cannot change estate company from profile settings'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_lock_privileged_columns on public.profiles;
create trigger trg_profiles_lock_privileged_columns
  before update on public.profiles
  for each row
  execute function public.profiles_lock_privileged_columns();

-- ========== STORAGE: partner avatars ==========
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Public read avatars" on storage.objects;
drop policy if exists "Partner upload own avatar" on storage.objects;
drop policy if exists "Partner update own avatar" on storage.objects;
drop policy if exists "Partner delete own avatar" on storage.objects;

create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Path must be {auth.uid()}/…
create policy "Partner upload own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('partner', 'admin')
    )
  );

create policy "Partner update own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('partner', 'admin')
    )
  );

create policy "Partner delete own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('partner', 'admin')
    )
  );
