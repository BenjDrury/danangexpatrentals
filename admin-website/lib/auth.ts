import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { User, UserRole } from "types";
import { createClient } from "@/lib/supabase/server";

export async function getProfile(
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
}

export async function requireAdmin(): Promise<{
  user: SupabaseUser;
  profile: User;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profileRow = await getProfile(user.id);
  if (!profileRow || profileRow.role !== "admin") return null;

  return {
    user,
    profile: {
      id: user.id,
      role: profileRow.role,
    },
  };
}
