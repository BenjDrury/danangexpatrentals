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
   - In the `website` folder, copy `.env.example` to `.env.local` (or set the same vars in Vercel).
   - Add Supabase URL + anon key, Resend API key, `LEAD_NOTIFY_EMAIL`, and optionally `NEXT_PUBLIC_WHATSAPP_NUMBER`.

3. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - Run `website/supabase-leads.sql` in the SQL Editor to create the `leads` table.

4. **Resend**
   - Get an API key at [resend.com](https://resend.com). Use a verified domain for production; for testing you can use `onboarding@resend.dev` as the from address.

## Deploy (Vercel)

- Connect this repo to Vercel.
- Set **Root Directory** to `website`.
- Add the same env vars from `website/.env.example`.
- Deploy.

## When leads come in

See **[docs/WHEN-LEADS-COME-IN.md](docs/WHEN-LEADS-COME-IN.md)** for the step-by-step process and reply templates.
