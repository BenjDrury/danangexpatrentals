import { cache } from "react";
import type { User, UserRole } from "types";
import { createClient } from "@/lib/supabase/server";

export const getProfile = cache(async function getProfile(
  userId: string
): Promise<{ role: UserRole } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return { role: data.role as UserRole };
});

export type AdminSession = {
  user: { id: string; email: string | undefined };
  profile: User;
};

/**
 * Deduped per request. Uses getClaims() (local JWT verify) instead of
 * getUser() so layout/auth checks don't hit the Auth server on every nav.
 */
export const requireAdmin = cache(async function requireAdmin(): Promise<AdminSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  const userId = String(claims.sub);
  const profileRow = await getProfile(userId);
  if (!profileRow || profileRow.role !== "admin") return null;

  return {
    user: {
      id: userId,
      email: typeof claims.email === "string" ? claims.email : undefined,
    },
    profile: {
      id: userId,
      role: profileRow.role,
    },
  };
});
