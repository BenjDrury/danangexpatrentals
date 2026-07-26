-- Concierge / listing inquiry: email required, WhatsApp optional.
-- App validates email on submit; WhatsApp may be null or empty.

alter table public.leads
  alter column whatsapp drop not null;

comment on column public.leads.whatsapp is
  'Optional WhatsApp number from the public contact / inquiry forms.';

comment on column public.leads.email is
  'Required email from the public contact / inquiry forms (enforced in app).';
