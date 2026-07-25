/**
 * Coworking space listed in the Living guide registry.
 * area_id optionally references public.areas(id).
 */
export interface CoworkingSpace {
  id: string;
  name: string;
  area_id?: string | null;
  neighbourhood_label?: string | null;
  description: string;
  address?: string | null;
  day_pass_usd?: number | null;
  monthly_usd?: number | null;
  price_note?: string | null;
  wifi_note?: string | null;
  best_for?: string | null;
  website_url?: string | null;
  maps_url?: string | null;
  images: string[];
  tags: string[];
  sort_order: number;
  published?: boolean;
  created_at?: string;
  updated_at?: string;
}
