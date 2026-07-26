/**
 * User profile (public.profiles). id matches auth.users(id).
 */
export type UserRole = "user" | "admin" | "partner";

export interface User {
  id: string;
  role: UserRole;
  estate_company_id?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  contact_email?: string | null;
  bio?: string | null;
  created_at?: string;
  updated_at?: string;
}
