import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User, UserRole } from "types";
import { createClient } from "@/lib/supabase/server";

/** httpOnly cookie: admin “view as” estate company. */
export const IMPERSONATE_COOKIE = "partner_impersonate_company_id";

export type AuthUser = { id: string; email: string | undefined };

export type PartnerSession = {
  user: AuthUser;
  profile: User;
  estateCompanyId: string;
  isAdmin: boolean;
  isImpersonating: boolean;
};

export type StudioUser = {
  user: AuthUser;
  profile: User;
  /** Active company for studio data — partner’s own, or admin cookie / profile default. */
  estateCompanyId: string | null;
  isAdmin: boolean;
  isImpersonating: boolean;
};

export type AdminSession = {
  user: AuthUser;
  profile: User;
};

export const getProfile = cache(async function getProfile(userId: string): Promise<{
  role: UserRole;
  estate_company_id: string | null;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  contact_email: string | null;
  bio: string | null;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "role, estate_company_id, display_name, avatar_url, phone, whatsapp, contact_email, bio",
    )
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return {
    role: data.role as UserRole,
    estate_company_id: data.estate_company_id ?? null,
    display_name: data.display_name ?? null,
    avatar_url: (data.avatar_url as string | null) ?? null,
    phone: (data.phone as string | null) ?? null,
    whatsapp: (data.whatsapp as string | null) ?? null,
    contact_email: (data.contact_email as string | null) ?? null,
    bio: (data.bio as string | null) ?? null,
  };
});

export const getImpersonationCompanyId = cache(async function getImpersonationCompanyId(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(IMPERSONATE_COOKIE)?.value?.trim();
  return value || null;
});

async function claimsUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return {
    id: String(claims.sub),
    email: typeof claims.email === "string" ? claims.email : undefined,
  };
}

/** Any signed-in partner or admin (admin may have no company yet). Deduped per request. */
export const getStudioUser = cache(async function getStudioUser(): Promise<StudioUser | null> {
  const user = await claimsUser();
  if (!user) return null;

  const profileRow = await getProfile(user.id);
  if (!profileRow) return null;
  if (profileRow.role !== "partner" && profileRow.role !== "admin") return null;

  const isAdmin = profileRow.role === "admin";
  const impersonatedId = isAdmin ? await getImpersonationCompanyId() : null;

  // Admins are not members of companies — company context only via impersonation.
  let estateCompanyId: string | null = null;
  if (isAdmin) {
    estateCompanyId = impersonatedId;
  } else {
    estateCompanyId = profileRow.estate_company_id;
  }

  return {
    user,
    profile: profileFromRow(user.id, profileRow),
    estateCompanyId,
    isAdmin,
    isImpersonating: Boolean(isAdmin && impersonatedId),
  };
});

function profileFromRow(
  userId: string,
  profileRow: NonNullable<Awaited<ReturnType<typeof getProfile>>>,
): User {
  return {
    id: userId,
    role: profileRow.role,
    estate_company_id: profileRow.estate_company_id,
    display_name: profileRow.display_name,
    avatar_url: profileRow.avatar_url,
    phone: profileRow.phone,
    whatsapp: profileRow.whatsapp,
    contact_email: profileRow.contact_email,
    bio: profileRow.bio,
  };
}

export const requireAdmin = cache(async function requireAdmin(): Promise<AdminSession | null> {
  const user = await claimsUser();
  if (!user) return null;

  const profileRow = await getProfile(user.id);
  if (!profileRow || profileRow.role !== "admin") return null;

  return {
    user,
    profile: profileFromRow(user.id, profileRow),
  };
});

/**
 * Soft check for studio data routes.
 * Partner → their company; admin → impersonation cookie only.
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
 * Admins without an impersonation cookie go to the partner picker.
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
