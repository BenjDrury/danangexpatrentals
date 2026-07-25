/**
 * Activity / experience listed in the Living guide registry.
 * area_id optionally references public.areas(id).
 */
export interface Activity {
  id: string;
  name: string;
  /** e.g. surf, wellness, food, day-trip, outdoors, gym */
  category: string;
  area_id?: string | null;
  neighbourhood_label?: string | null;
  description: string;
  typical_price_usd?: number | null;
  price_note?: string | null;
  duration_note?: string | null;
  website_url?: string | null;
  maps_url?: string | null;
  booking_url?: string | null;
  images: string[];
  tags: string[];
  sort_order: number;
  published?: boolean;
  created_at?: string;
  updated_at?: string;
}
