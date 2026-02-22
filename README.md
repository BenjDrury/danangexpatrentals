# Da Nang Expat Rentals

MVP landing page + concierge form for expat rentals in Da Nang. Minimal stack: Next.js (App Router), Tailwind, Supabase (leads), Resend (notifications). No auth, no CMS.

## Setup

1. **Install and run**
   ```bash
   npm install
   npm run dev
   ```
   Opens at [http://localhost:3000](http://localhost:3000).

2. **Environment**
   - **Public** (in `website/.env`, committed): Supabase URL + publishable key. WhatsApp number is in `backend/common/constants/whatsapp-number.ts`.
   - **Secrets** (in `website/.secret.local`, gitignored): Copy `.secret.local.example` to `.secret.local` and add `RESEND_API_KEY`. Lead notify email and Resend “from” address are set in `backend/common/constants/` (edit those files to change them).

3. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - Run `website/supabase-leads.sql` in the SQL Editor to create the `leads` table.

4. **Resend**
   - Get an API key at [resend.com](https://resend.com). Use a verified domain for production; for testing you can use `onboarding@resend.dev` as the from address.

## Deploy (Vercel)

- Connect this repo to Vercel.
- Set **Root Directory** to `website`.
- Add public vars from `website/.env`. Add secret `RESEND_API_KEY` in Vercel dashboard. Set lead-notify and resend-from in `backend/common/constants/` or via build env if you override there.
- Deploy.

## When leads come in

See **[docs/WHEN-LEADS-COME-IN.md](docs/WHEN-LEADS-COME-IN.md)** for the step-by-step process and reply templates.
