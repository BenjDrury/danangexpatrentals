/**
 * Estate / property company or agent, e.g. from Facebook page profile.
 * Stored in public.estate_companies; apartments can reference via estate_company_id.
 */
export interface EstateCompany {
  id: string;
  /** Facebook page or profile identifier (delegate_page_id or profile_id). */
  facebook_id: string;
  /** Display name (e.g. user_username_raw or page name). */
  name: string;
  /** Facebook page URL. */
  page_url: string | null;
  /** Logo or avatar image URL. */
  logo_url: string | null;
  /** Optional: page followers count. */
  page_followers: number | null;
  created_at?: string;
  updated_at?: string;
}
