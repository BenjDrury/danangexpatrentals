# Supabase migrations & seed

Run these in the **Supabase SQL Editor** in order (or via `scripts` / `psql` with `SUPABASE_DB_URI`):

Numbered files in this folder (`01` … `16`). Notable recent:

- **14-listing-validity.sql** — `last_validity_check` for public freshness
- **15-partner-integrations.sql** — partner OAuth / integrations
- **16-listing-status-approval.sql** — `pending_review`, default status `draft`, `live_requested_at`, partner cannot set `available` (trigger)

Use the same Supabase project for the main website, admin-website, and partner-website.
