# Supabase migrations & seed

Run these in the **Supabase SQL Editor** in order:

1. **01-leads.sql** — leads table (contact form)
2. **02-areas-apartments.sql** — areas, apartment_types, apartments + seed data
3. **03-users.sql** — profiles (for admin-website roles)
4. **04-admin-rls.sql** — lets logged-in admins read areas, apartment types, apartments, leads
5. **05-admin-write.sql** — lets authenticated users update/insert/delete areas and apartment_types
6. **06-admin-only-write.sql** — restricts those writes to users with `role = 'admin'` in `profiles` (run after 05)

Use the same Supabase project for the main website and admin-website.
