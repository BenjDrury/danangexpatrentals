# Supabase migrations & seed

Run these in the **Supabase SQL Editor** in order (or via `scripts` / `psql` with `SUPABASE_DB_URI`):

Numbered files in this folder (`01` … `25`). Notable recent:

- **14-listing-validity.sql** — `last_validity_check` for public freshness
- **15-partner-integrations.sql** — partner OAuth / integrations
- **16-listing-status-approval.sql** — `pending_review`, default status `draft`, `live_requested_at`, partner cannot set `available` (trigger)
- **19-facebook-groups.sql** — Facebook group catalog + per-company selections
- **25-facebook-groups-defaults.sql** — seed three default groups for Promote overlay
- **26-listing-facebook-posts.sql** — per-listing Facebook Page/group publish history + `last_facebook_posted_at`

Use the same Supabase project for the main website, admin-website, and partner-website.
