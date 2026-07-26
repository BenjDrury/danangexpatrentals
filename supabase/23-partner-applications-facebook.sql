-- Optional Facebook page URL / handle on partner applications.

alter table public.partner_applications
  add column if not exists facebook_page text;
