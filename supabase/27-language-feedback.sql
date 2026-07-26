-- Admin language feedback: capture marked UI copy + locale + comment for translation QA.

create table if not exists public.language_feedback (
  id uuid primary key default gen_random_uuid(),
  selected_text text not null
    check (char_length(trim(selected_text)) > 0 and char_length(selected_text) <= 4000),
  page_path text not null
    check (char_length(trim(page_path)) > 0 and char_length(page_path) <= 500),
  locale text not null
    check (locale in ('en', 'vi')),
  comment text not null default ''
    check (char_length(comment) <= 4000),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_language_feedback_created_at
  on public.language_feedback (created_at desc);

create index if not exists idx_language_feedback_locale
  on public.language_feedback (locale);

comment on table public.language_feedback is
  'Admin-only notes on marked UI copy (selected text, page, locale, comment) for translation QA.';

alter table public.language_feedback enable row level security;

drop policy if exists "Admin insert language_feedback" on public.language_feedback;
create policy "Admin insert language_feedback"
  on public.language_feedback for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Admin select language_feedback" on public.language_feedback;
create policy "Admin select language_feedback"
  on public.language_feedback for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Admin delete language_feedback" on public.language_feedback;
create policy "Admin delete language_feedback"
  on public.language_feedback for delete to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
