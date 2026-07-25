import type { User as SupabaseUser } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User, UserRole } from "types";
import { createClient } from "@/lib/supabase/server";

/** httpOnly cookie: admin “view as” estate company. */
export const IMPERSONATE_COOKIE = "partner_impersonate_company_id";

export type PartnerSession = {
  user: SupabaseUser;
  profile: User;
  estateCompanyId: string;
  isAdmin: boolean;
  isImpersonating: boolean;
};

export type StudioUser = {
  user: SupabaseUser;
  profile: User;
  /** Active company for studio data — partner’s own, or admin cookie / profile default. */
  estateCompanyId: string | null;
  isAdmin: boolean;
  isImpersonating: boolean;
};

export type AdminSession = {
  user: SupabaseUser;
  profile: User;
};

export async function getProfile(userId: string): Promise<{
  role: UserRole;
  estate_company_id: string | null;
  display_name: string | null;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role, estate_company_id, display_name")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return {
    role: data.role as UserRole,
    estate_company_id: data.estate_company_id ?? null,
    display_name: data.display_name ?? null,
  };
}

export async function getImpersonationCompanyId(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(IMPERSONATE_COOKIE)?.value?.trim();
  return value || null;
}

/** Any signed-in partner or admin (admin may have no company yet). */
export async function getStudioUser(): Promise<StudioUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profileRow = await getProfile(user.id);
  if (!profileRow) return null;
  if (profileRow.role !== "partner" && profileRow.role !== "admin") return null;

  const isAdmin = profileRow.role === "admin";
  const impersonatedId = isAdmin ? await getImpersonationCompanyId() : null;

  let estateCompanyId: string | null = null;
  if (isAdmin) {
    // Cookie wins; otherwise admin’s linked default company.
    estateCompanyId = impersonatedId ?? profileRow.estate_company_id;
  } else {
    estateCompanyId = profileRow.estate_company_id;
  }

  return {
    user,
    profile: {
      id: user.id,
      role: profileRow.role,
      estate_company_id: profileRow.estate_company_id,
      display_name: profileRow.display_name,
    },
    estateCompanyId,
    isAdmin,
    isImpersonating: Boolean(isAdmin && impersonatedId),
  };
}

export async function requireAdmin(): Promise<AdminSession | null> {
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
      estate_company_id: profileRow.estate_company_id,
      display_name: profileRow.display_name,
    },
  };
}

/**
 * Soft check for studio data routes.
 * Partner → their company; admin → impersonation cookie or profile default company.
 */
export async function requirePartner(): Promise<PartnerSession | null> {
  const studio = await getStudioUser();
  if (!studio?.estateCompanyId) return null;

  return {
    user: studio.user,
    profile: studio.profile,
    estateCompanyId: studio.estateCompanyId,
    isAdmin: studio.isAdmin,
    isImpersonating: studio.isImpersonating,
  };
}

/**
 * Studio pages that need a company context.
 * Admins without cookie and without a linked default company go to the partner picker.
 */
export async function requireStudioCompany(): Promise<PartnerSession> {
  const studio = await getStudioUser();
  if (!studio) redirect("/unauthorized");
  if (studio.isAdmin && !studio.estateCompanyId) {
    redirect("/admin/partners");
  }
  if (!studio.estateCompanyId) redirect("/unauthorized");

  return {
    user: studio.user,
    profile: studio.profile,
    estateCompanyId: studio.estateCompanyId,
    isAdmin: studio.isAdmin,
    isImpersonating: studio.isImpersonating,
  };
}

/** Relative path only — blocks open redirects. */
export function safeRelativePath(next: string | null | undefined): string {
  if (!next) return "/";
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return "/";
  return trimmed;
}
