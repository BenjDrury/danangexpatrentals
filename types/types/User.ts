/**
 * User profile (public.profiles). id matches auth.users(id).
 */
export type UserRole = "user" | "admin";

export interface User {
  id: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}
