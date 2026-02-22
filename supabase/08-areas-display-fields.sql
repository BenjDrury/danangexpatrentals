-- Add columns to public.areas for simplified/display CSV (aliases, district, distances, typical rent, scores, pros/cons).
-- Run after 07-areas-csv-columns.sql. All new columns nullable.

alter table public.areas
  add column if not exists aliases text,
  add column if not exists district text,
  add column if not exists distance_to_beach_km numeric,
  add column if not exists distance_to_cbd_km numeric,
  add column if not exists typical_rent_1br_usd numeric,
  add column if not exists typical_rent_2br_usd numeric,
  add column if not exists expat_density text,
  add column if not exists noise_level text,
  add column if not exists walkability_score numeric,
  add column if not exists amenities_score numeric,
  add column if not exists long_term_rental_suitability text,
  add column if not exists pros text,
  add column if not exists cons text;
