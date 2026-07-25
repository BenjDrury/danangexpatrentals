import type { Feature } from "./Feature";

/**
 * Apartment listing. area_id references public.areas(id).
 */
export interface Apartment {
  id: string;
  area_id: string;
  title: string;
  description: string | null;
  /**
   * Legacy USD monthly amount for filtering/sorting.
   * Kept in sync with price_usd when partners save.
   */
  price: number;
  /** Dual-currency display e.g. "$800 · 20.320.000₫" (synced at save). */
  price_display: string;
  /** Amount as entered by the partner. */
  price_amount?: number | null;
  /** Currency of price_amount. */
  price_currency?: "USD" | "VND" | null;
  /** USD equivalent computed at save (FX rate). */
  price_usd?: number | null;
  /** VND equivalent computed at save (FX rate). */
  price_vnd?: number | null;
  main_image: string;
  /** Additional image URLs (gallery). */
  images: string[];
  bedrooms: number;
  bathrooms: number | null;
  /** Size in square meters. */
  size_sqm: number | null;
  /** e.g. ["furnished", "balcony", "washing machine"] */
  features: Feature[];
  /** ISO date when available. */
  available_from: string | null;
  /** Minimum lease length in months. */
  min_lease_months: number | null;
  /** Sort order for listing (lower = first). */
  sort_order: number;
  /** Reference to estate company / agent (e.g. Facebook page). */
  estate_company_id?: string | null;
  /** Original source URL (e.g. Facebook post permalink). */
  source_url?: string | null;
  /** External post ID for deduplication (e.g. Facebook post_id). */
  source_post_id?: string | null;
  /**
   * Listing lifecycle:
   * draft → pending_review (partner request) → available (admin approve)
   * | reserved | rented
   */
  status?: "draft" | "pending_review" | "available" | "reserved" | "rented";
  video_urls?: string[];
  partner_notes?: string | null;
  last_bumped_at?: string | null;
  /** When a partner last confirmed the listing is still valid. Null = never checked. */
  last_validity_check?: string | null;
  /** When partner last requested admin approval to go live. */
  live_requested_at?: string | null;
  /** Optional admin note when rejecting a go-live request. */
  live_rejection_note?: string | null;
  public_slug?: string | null;
  created_at?: string;
  updated_at?: string;
}
