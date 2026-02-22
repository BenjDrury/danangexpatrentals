-- Run after 03-users. Allows logged-in (authenticated) users to read content
-- so the admin-website can show areas, apartment types, apartments, and leads.

create policy "Allow authenticated read areas"
  on public.areas for select to authenticated using (true);

create policy "Allow authenticated read apartment_types"
  on public.apartment_types for select to authenticated using (true);

create policy "Allow authenticated read apartments"
  on public.apartments for select to authenticated using (true);

create policy "Allow authenticated read leads"
  on public.leads for select to authenticated using (true);
