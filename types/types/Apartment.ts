/**
 * Apartment listing. area_id references public.areas(id).
 */
export interface Apartment {
  id: string;
  area_id: string;
  title: string;
  description: string | null;
  /** Price in USD per month (for filtering/sorting). */
  price: number;
  /** Display string e.g. "$350/month" or "from $320" */
  price_display: string;
  main_image: string;
  /** Additional image URLs (gallery). */
  images: string[];
  bedrooms: number;
  bathrooms: number | null;
  /** Size in square meters. */
  size_sqm: number | null;
  /** e.g. ["furnished", "balcony", "washing machine"] */
  features: string[];
  /** ISO date when available. */
  available_from: string | null;
  /** Minimum lease length in months. */
  min_lease_months: number | null;
  /** Sort order for listing (lower = first). */
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}
