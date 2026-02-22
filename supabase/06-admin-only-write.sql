-- Run after 05-admin-write. Restricts write access to admin users only.
-- Drop the "any authenticated" write policies and replace with admin-only.

drop policy if exists "Allow authenticated insert areas" on public.areas;
drop policy if exists "Allow authenticated update areas" on public.areas;
drop policy if exists "Allow authenticated delete areas" on public.areas;

create policy "Allow admin insert areas"
  on public.areas for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Allow admin update areas"
  on public.areas for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Allow admin delete areas"
  on public.areas for delete to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Allow authenticated insert apartment_types" on public.apartment_types;
drop policy if exists "Allow authenticated update apartment_types" on public.apartment_types;
drop policy if exists "Allow authenticated delete apartment_types" on public.apartment_types;

create policy "Allow admin insert apartment_types"
  on public.apartment_types for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Allow admin update apartment_types"
  on public.apartment_types for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Allow admin delete apartment_types"
  on public.apartment_types for delete to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
