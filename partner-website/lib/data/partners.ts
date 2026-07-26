import { randomBytes, randomUUID } from "crypto";
import { requireAdmin } from "@/lib/auth";
import {
  generateAuthLoginLink,
  getPartnerAppUrl,
  sendPartnerInviteEmail,
} from "@/lib/email/auth-links";
import { getServiceRoleClient } from "@/lib/supabase/server";

export type AdminPartnerRow = {
  /** Profile id when a partner user exists; otherwise a synthetic key for company-only rows. */
  profileId: string;
  displayName: string | null;
  /** Supabase Auth login email (null if no auth user / email). */
  email: string | null;
  /** True when auth.users.last_sign_in_at is set. */
  hasLoggedIn: boolean;
  lastSignInAt: string | null;
  phone: string | null;
  whatsapp: string | null;
  /** Profile contact email (may differ from login email). */
  contactEmail: string | null;
  companyPhone: string | null;
  companyWhatsapp: string | null;
  companyEmail: string | null;
  /** Pending partner_invites.email when company has no user yet. */
  pendingInviteEmail: string | null;
  estateCompanyId: string | null;
  companyName: string | null;
  listingCount: number;
  /** True when the company has no partner/auth user yet (admin Become still works by company id). */
  companyOnly?: boolean;
};

export type ListPartnersResult = {
  partners: AdminPartnerRow[];
  /** Set when service role is not configured — profiles RLS blocks listing otherwise. */
  missingServiceRole?: boolean;
};

export type CreateAdminPartnerResult = {
  inviteUrl?: string;
  loginUrl?: string;
  companyId?: string;
  companyName?: string;
  email?: string;
  emailed?: boolean;
  emailError?: string;
  error?: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function newInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * List partner profiles + estate companies without a linked partner user.
 * Uses service role: profiles RLS only allows reading own row.
 * Call only after requireAdmin().
 */
export async function listPartnersForAdmin(): Promise<ListPartnersResult> {
  const admin = await requireAdmin();
  if (!admin) return { partners: [] };

  const supabase = getServiceRoleClient();
  if (!supabase) return { partners: [], missingServiceRole: true };

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, estate_company_id, phone, whatsapp, contact_email",
    )
    .eq("role", "partner")
    .order("display_name", { ascending: true });

  if (error) return { partners: [] };

  const { data: companies } = await supabase
    .from("estate_companies")
    .select("id, name, contact_phone, contact_whatsapp, contact_email")
    .order("name", { ascending: true });

  type CompanyMeta = {
    name: string;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
  };
  const companyById = new Map<string, CompanyMeta>();
  for (const c of companies ?? []) {
    companyById.set(c.id as string, {
      name: c.name as string,
      phone: (c.contact_phone as string | null) ?? null,
      whatsapp: (c.contact_whatsapp as string | null) ?? null,
      email: (c.contact_email as string | null) ?? null,
    });
  }

  const linkedCompanyIds = new Set(
    (profiles ?? [])
      .map((p) => p.estate_company_id as string | null)
      .filter((id): id is string => Boolean(id)),
  );

  const allCompanyIds = [...new Set([...(companies ?? []).map((c) => c.id as string)])];

  const listingCountByCompany = new Map<string, number>();
  if (allCompanyIds.length) {
    const { data: apts } = await supabase
      .from("apartments")
      .select("estate_company_id")
      .in("estate_company_id", allCompanyIds);
    for (const a of apts ?? []) {
      const cid = a.estate_company_id as string;
      listingCountByCompany.set(cid, (listingCountByCompany.get(cid) ?? 0) + 1);
    }
  }

  const pendingInviteByCompany = new Map<string, string>();
  if (allCompanyIds.length) {
    const { data: invites } = await supabase
      .from("partner_invites")
      .select("estate_company_id, email, created_at")
      .eq("status", "pending")
      .in("estate_company_id", allCompanyIds)
      .order("created_at", { ascending: false });
    for (const inv of invites ?? []) {
      const cid = inv.estate_company_id as string;
      if (pendingInviteByCompany.has(cid)) continue;
      pendingInviteByCompany.set(cid, inv.email as string);
    }
  }

  type AuthMeta = { email: string | null; lastSignInAt: string | null };
  const authById = new Map<string, AuthMeta>();
  try {
    const { data: listed } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    for (const u of listed?.users ?? []) {
      authById.set(u.id, {
        email: u.email ?? null,
        lastSignInAt: u.last_sign_in_at ?? null,
      });
    }
  } catch {
    // Auth metadata optional if admin API unavailable
  }

  const rows: AdminPartnerRow[] = (profiles ?? []).map((p) => {
    const estateCompanyId = (p.estate_company_id as string | null) ?? null;
    const company = estateCompanyId ? companyById.get(estateCompanyId) : undefined;
    const auth = authById.get(p.id as string);
    return {
      profileId: p.id as string,
      displayName: (p.display_name as string | null) ?? null,
      email: auth?.email ?? null,
      hasLoggedIn: Boolean(auth?.lastSignInAt),
      lastSignInAt: auth?.lastSignInAt ?? null,
      phone: (p.phone as string | null) ?? null,
      whatsapp: (p.whatsapp as string | null) ?? null,
      contactEmail: (p.contact_email as string | null) ?? null,
      companyPhone: company?.phone ?? null,
      companyWhatsapp: company?.whatsapp ?? null,
      companyEmail: company?.email ?? null,
      pendingInviteEmail: estateCompanyId
        ? (pendingInviteByCompany.get(estateCompanyId) ?? null)
        : null,
      estateCompanyId,
      companyName: company?.name ?? null,
      listingCount: estateCompanyId
        ? (listingCountByCompany.get(estateCompanyId) ?? 0)
        : 0,
    };
  });

  // Companies with no partner user — still Become-able by company id.
  for (const c of companies ?? []) {
    const id = c.id as string;
    if (linkedCompanyIds.has(id)) continue;
    const company = companyById.get(id);
    rows.push({
      profileId: `company:${id}`,
      displayName: null,
      email: null,
      hasLoggedIn: false,
      lastSignInAt: null,
      phone: null,
      whatsapp: null,
      contactEmail: null,
      companyPhone: company?.phone ?? null,
      companyWhatsapp: company?.whatsapp ?? null,
      companyEmail: company?.email ?? null,
      pendingInviteEmail: pendingInviteByCompany.get(id) ?? null,
      estateCompanyId: id,
      companyName: company?.name ?? null,
      listingCount: listingCountByCompany.get(id) ?? 0,
      companyOnly: true,
    });
  }

  rows.sort((a, b) => {
    const an = (a.companyName || a.displayName || "").toLowerCase();
    const bn = (b.companyName || b.displayName || "").toLowerCase();
    return an.localeCompare(bn);
  });

  return { partners: rows };
}

/**
 * Admin onboarding: create (or reuse) an estate company and a pending invite.
 * The invitee sets their own password at `/invite/[token]`.
 */
export async function createAdminPartnerInvite(input: {
  companyName: string;
  email: string;
  /** When set, invite into this existing company instead of creating a new one. */
  estateCompanyId?: string;
}): Promise<CreateAdminPartnerResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized." };

  const service = getServiceRoleClient();
  if (!service) {
    return {
      error:
        "Server missing SUPABASE_SERVICE_ROLE_KEY. Add it to partner-website/.secret.local and restart.",
    };
  }

  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  let companyId = input.estateCompanyId?.trim() || "";
  let companyName = input.companyName.trim();

  if (companyId) {
    const { data: existing, error: existingError } = await service
      .from("estate_companies")
      .select("id, name")
      .eq("id", companyId)
      .maybeSingle();
    if (existingError || !existing) {
      return { error: "Company not found." };
    }
    companyName = (existing.name as string) || companyName;
  } else {
    if (!companyName) return { error: "Company name is required." };
    if (companyName.length > 120) return { error: "Company name is too long." };

    const { data: created, error: createError } = await service
      .from("estate_companies")
      .insert({
        name: companyName,
        // Required unique column; synthetic id for non-Facebook partners.
        facebook_id: `manual-${randomUUID()}`,
      })
      .select("id, name")
      .single();

    if (createError || !created) {
      return { error: createError?.message ?? "Could not create company." };
    }
    companyId = created.id as string;
    companyName = (created.name as string) || companyName;
  }

  // Already a partner on this company?
  try {
    const { data: listed } = await service.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const existingUser = listed?.users?.find(
      (u) => u.email && normalizeEmail(u.email) === email,
    );
    if (existingUser) {
      const { data: profile } = await service
        .from("profiles")
        .select("estate_company_id, role")
        .eq("id", existingUser.id)
        .maybeSingle();
      if (
        profile?.role === "partner" &&
        profile.estate_company_id === companyId
      ) {
        return { error: "That email is already a partner on this company." };
      }
      if (
        profile?.role === "partner" &&
        profile.estate_company_id &&
        profile.estate_company_id !== companyId
      ) {
        return {
          error: "That email is already linked to another partner company.",
        };
      }
      if (profile?.role === "admin") {
        return { error: "Admin accounts can’t be invited as partners." };
      }
    }
  } catch {
    // Invite still useful if listUsers fails
  }

  await service
    .from("partner_invites")
    .update({ status: "revoked" })
    .eq("estate_company_id", companyId)
    .eq("status", "pending")
    .eq("email", email);

  const token = newInviteToken();
  const { data: invite, error: inviteError } = await service
    .from("partner_invites")
    .insert({
      estate_company_id: companyId,
      email,
      invited_by: admin.user.id,
      status: "pending",
      token,
    })
    .select("token")
    .single();

  if (inviteError || !invite) {
    return { error: inviteError?.message ?? "Could not create invite." };
  }

  const invitePath = `/invite/${invite.token as string}`;
  const result: CreateAdminPartnerResult = {
    inviteUrl: invitePath,
    companyId,
    companyName,
    email,
  };

  const siteUrl = await getPartnerAppUrl();
  const absoluteInviteUrl = `${siteUrl}${invitePath}`;
  const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(invitePath)}`;

  const generated = await generateAuthLoginLink(service, email, redirectTo);
  if (!generated.link) {
    result.emailError =
      generated.error ?? "Invite created, but could not build login link.";
    return result;
  }

  result.loginUrl = generated.link.actionLink;
  const emailed = await sendPartnerInviteEmail({
    to: email,
    companyName,
    loginLink: generated.link.actionLink,
    inviteUrl: absoluteInviteUrl,
  });

  if (emailed.error) {
    result.emailError = emailed.error;
  } else {
    result.emailed = true;
  }

  return result;
}
