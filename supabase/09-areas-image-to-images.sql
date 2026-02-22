-- Migration: rename areas.image (text) to areas.images (text[]).
-- Run only if you already have the old "image" column (e.g. after 02-areas-apartments before this change).

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'areas' and column_name = 'image'
  ) then
    alter table public.areas add column if not exists images text[] not null default '{}';
    update public.areas set images = case
      when image is not null and trim(image) <> '' then ARRAY[trim(image)]
      else '{}'
    end;
    alter table public.areas drop column image;
  end if;
end $$;
