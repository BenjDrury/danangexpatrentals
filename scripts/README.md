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
