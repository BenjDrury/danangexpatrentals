-- Run after 04-admin-rls. Lets authenticated users (admin) insert, update, delete
-- areas and apartment_types from the admin-website.

create policy "Allow authenticated insert areas"
  on public.areas for insert to authenticated with check (true);

create policy "Allow authenticated update areas"
  on public.areas for update to authenticated using (true);

create policy "Allow authenticated delete areas"
  on public.areas for delete to authenticated using (true);

create policy "Allow authenticated insert apartment_types"
  on public.apartment_types for insert to authenticated with check (true);

create policy "Allow authenticated update apartment_types"
  on public.apartment_types for update to authenticated using (true);

create policy "Allow authenticated delete apartment_types"
  on public.apartment_types for delete to authenticated using (true);
