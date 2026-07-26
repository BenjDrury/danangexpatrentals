# Scripts

Use **scripts/.secret.local** (or **scripts/secrets**) for secrets; copy from **scripts/.secret.local.example**.

---

## setup-supabase

Runs the Supabase SQL migrations in order: `supabase/01-leads.sql`, `02-areas-apartments.sql`, `03-users.sql`. Use for a new project or a fresh database.

**Required in .secret.local:** `SUPABASE_DB_URI`  
Get it from Supabase Dashboard → **Settings** → **Database** → **Connection string**. Use the **Connection pooling** (Transaction) URI — **port 6543** and host `*.pooler.supabase.com`. Do not use the direct URI (port 5432); it often fails from local networks. Replace `[YOUR-PASSWORD]` with your database password.

**Usage** (from repo root):

```bash
npm run setup-supabase
```

Install deps first if needed: `npm install` (adds `pg` as devDependency).

---

## make-admin

Makes a Supabase user an admin (inserts/updates `public.profiles` with `role = 'admin'`). Run after **03-users.sql** (or `npm run setup-supabase`) has created the `profiles` table.

**Required in .secret.local:** `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY`.  
Service role key: Supabase Dashboard → **Settings** → **API** → *service_role* (secret).

**Usage** (from repo root):

```bash
npm run make-admin -- <user-uuid>
```

Get the user UUID from Supabase → **Authentication** → **Users** → click the user → copy the **User UID**.

Example:

```bash
npm run make-admin -- a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## extract-facebook (Chrome tab → seed)

Local **macOS** helper: reads a logged-in Google Chrome Facebook tab, writes JSON under `tmp_fb/`, then upserts an `estate_companies` row and inserts **draft** apartments (photos uploaded to the `apartments` Storage bucket).

**Preconditions**
- Google Chrome open, logged into Facebook
- Target group-user or profile page open in a tab (or pass `--url=`)
- Allow Chrome automation if macOS prompts (System Settings → Privacy)
- Areas already seeded in Supabase

**Required in .secret.local** (unless `--dry-run`): `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY`.

**Usage** (from repo root):

```bash
# Page already open in Chrome — extract + seed
npm run extract-facebook

# Navigate Chrome to a URL first
npm run extract-facebook -- --url='https://www.facebook.com/groups/203559903815711/user/100054892217906'

# Extract JSON only (no DB writes)
npm run extract-facebook -- --dry-run --limit=5

# Refresh company logo only (no listings / lightbox)
npm run extract-facebook -- --logo-only --url='https://www.facebook.com/groups/203559903815711/user/100054892217906'

# Options
#   --logo-only        company avatar/logo only (skips posts + lightbox)
#   --limit=5          max posts (default 5)
#   --images=20        max photos per post (default 20)
#   --min-image-bytes=25000   skip downloads smaller than this (default 25KB)
#   --scrolls=5        max scroll steps (default ≈ --limit); stops early once enough posts
#   --out=tmp_fb/x.json
#   --area=my-khe      fallback area_id (OpenAI overrides per post when key set)
#   --status=draft     listing status (default draft)
#   --no-llm           skip OpenAI structuring (regex only)
#   --match=<substr>   Chrome tab URL match (default: facebook.com or id from --url)
```

With `OPENAI_API_KEY` in `.secret.local`, each post is sent to OpenAI (`OPENAI_MODEL`, default `gpt-4o`; tries `gpt-5` / others if needed) to produce title, description, area, price, bedrooms, features, and seller contact (phone / WhatsApp-Zalo / email) when present.

After posts are processed, the script also:
- Downloads the Facebook profile/logo into the `apartments` Storage bucket (falls back to the CDN URL)
- Fills empty `estate_companies` fields: `logo_url`, `contact_phone`, `contact_whatsapp`, `contact_email` (does not overwrite values already set)

Duplicates are skipped by `source_url` / `source_post_id`. No partner auth user is created — use Admin → Become company to view company Settings.

---

## import-facebook-posts

Imports Facebook post JSON into `estate_companies` and `apartments`. Run **supabase/10-estate-companies.sql** first. Prefer **extract-facebook** when you already have the seller page open in Chrome.

**Required in .secret.local:** `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY`.

**Optional env:** `VND_TO_USD` (default `25000`) — exchange rate to convert "X million/month" VND to USD.

**Optional env:** `OPENAI_API_KEY` — if set, each post’s content is sent to OpenAI to extract structured fields (area_id, title, price, bedrooms, features, etc.) using your areas list. Without it, the script uses regex parsing only.  
**Optional env:** `OPENAI_MODEL` (default `gpt-3.5-turbo`; use `gpt-4o-mini` if your OpenAI account has access).

**Usage** (from repo root):

```bash
node scripts/run/import-facebook-posts.mjs path/to/posts.json
node scripts/run/import-facebook-posts.mjs path/to/posts.json --area=my-khe
```

JSON must be an array of Facebook post objects (e.g. from a scraper) with `content`, `attachments`, `post_id`, `url`, `delegate_page_id` or `profile_id`, `user_username_raw`, `page_url`, `page_logo`, etc. Duplicates by `source_post_id` are skipped.
