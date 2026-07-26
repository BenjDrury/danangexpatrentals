import { randomBytes } from "crypto";
import type { PartnerInviteStatus } from "types";
import { requirePartner } from "@/lib/auth";
import {
  generateAuthLoginLink,
  getPartnerAppUrl,
  sendPartnerInviteEmail,
} from "@/lib/email/auth-links";
import { createClient, getServiceRoleClient } from "@/lib/supabase/server";

export type TeamMember = {
  profileId: string;
  displayName: string | null;
  email: string | null;
  role: "partner" | "admin";
};

export type TeamInviteRow = {
  id: string;
  email: string;
  status: PartnerInviteStatus;
  token: string;
  createdAt: string;
  acceptedAt: string | null;
};

export type CompanyTeam = {
  members: TeamMember[];
  invites: TeamInviteRow[];
  missingServiceRole?: boolean;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function newInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * List partners + pending/recent invites for a company.
 * Uses service role for member emails (profiles RLS is own-row only).
 */
export async function getCompanyTeam(
  estateCompanyId: string,
): Promise<CompanyTeam> {
  const session = await requirePartner();
  if (!session || session.estateCompanyId !== estateCompanyId) {
    return { members: [], invites: [] };
  }

  const service = getServiceRoleClient();
  if (!service) {
    // Fall back: invites via user client; members without emails.
    const supabase = await createClient();
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, role")
      .eq("estate_company_id", estateCompanyId)
      .eq("role", "partner");

    const { data: invites } = await supabase
      .from("partner_invites")
      .select("id, email, status, token, created_at, accepted_at")
      .eq("estate_company_id", estateCompanyId)
      .order("created_at", { ascending: false });

    return {
      members: (profiles ?? []).map((p) => ({
        profileId: p.id as string,
        displayName: (p.display_name as string | null) ?? null,
        email: null,
        role: p.role as "partner" | "admin",
      })),
      invites: (invites ?? []).map(mapInviteRow),
      missingServiceRole: true,
    };
  }

  const { data: profiles } = await service
    .from("profiles")
    .select("id, display_name, role")
    .eq("estate_company_id", estateCompanyId)
    .eq("role", "partner")
    .order("display_name", { ascending: true });

  const emailById = new Map<string, string>();
  try {
    const { data: listed } = await service.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    for (const u of listed?.users ?? []) {
      if (u.email) emailById.set(u.id, u.email);
    }
  } catch {
    // Emails optional
  }

  const { data: invites } = await service
    .from("partner_invites")
    .select("id, email, status, token, created_at, accepted_at")
    .eq("estate_company_id", estateCompanyId)
    .order("created_at", { ascending: false });

  return {
    members: (profiles ?? []).map((p) => ({
      profileId: p.id as string,
      displayName: (p.display_name as string | null) ?? null,
      email: emailById.get(p.id as string) ?? null,
      role: p.role as "partner" | "admin",
    })),
    invites: (invites ?? []).map(mapInviteRow),
  };
}

function mapInviteRow(row: {
  id: string;
  email: string;
  status: string;
  token: string;
  created_at: string;
  accepted_at: string | null;
}): TeamInviteRow {
  return {
    id: row.id,
    email: row.email,
    status: row.status as PartnerInviteStatus,
    token: row.token,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at,
  };
}

export async function createPartnerInvite(
  emailRaw: string,
): Promise<{
  invite?: TeamInviteRow;
  inviteUrl?: string;
  loginUrl?: string;
  emailed?: boolean;
  emailError?: string;
  error?: string;
}> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const email = normalizeEmail(emailRaw);
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const service = getServiceRoleClient();
  const client = service ?? (await createClient());

  // Already a member?
  if (service) {
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
          profile.estate_company_id === session.estateCompanyId
        ) {
          return { error: "That person is already on this team." };
        }
      }
    } catch {
      // Continue — invite still useful
    }
  }

  // Revoke any prior pending invite for same email+company, then insert.
  await client
    .from("partner_invites")
    .update({ status: "revoked" })
    .eq("estate_company_id", session.estateCompanyId)
    .eq("status", "pending")
    .eq("email", email);

  const token = newInviteToken();
  const { data, error } = await client
    .from("partner_invites")
    .insert({
      estate_company_id: session.estateCompanyId,
      email,
      invited_by: session.user.id,
      status: "pending",
      token,
    })
    .select("id, email, status, token, created_at, accepted_at")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create invite." };
  }

  const invite = mapInviteRow(data);
  const invitePath = `/invite/${invite.token}`;
  const result: {
    invite: TeamInviteRow;
    inviteUrl: string;
    loginUrl?: string;
    emailed?: boolean;
    emailError?: string;
  } = {
    invite,
    inviteUrl: invitePath,
  };

  if (!service) {
    result.emailError =
      "Invite created, but email needs SUPABASE_SERVICE_ROLE_KEY + RESEND_API_KEY.";
    return result;
  }

  const siteUrl = await getPartnerAppUrl();
  const absoluteInviteUrl = `${siteUrl}${invitePath}`;
  const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(invitePath)}`;

  const { data: company } = await service
    .from("estate_companies")
    .select("name")
    .eq("id", session.estateCompanyId)
    .maybeSingle();

  const generated = await generateAuthLoginLink(service, email, redirectTo);
  if (!generated.link) {
    result.emailError =
      generated.error ?? "Invite created, but could not build login link.";
    return result;
  }

  result.loginUrl = generated.link.actionLink;
  const emailed = await sendPartnerInviteEmail({
    to: email,
    companyName: (company?.name as string) || "your team",
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

export async function revokePartnerInvite(
  inviteId: string,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("partner_invites")
    .update({ status: "revoked" })
    .eq("id", inviteId)
    .eq("estate_company_id", session.estateCompanyId)
    .eq("status", "pending");

  if (error) return { error: error.message };
  return { ok: true };
}

export type PublicInviteInfo = {
  id: string;
  email: string;
  status: PartnerInviteStatus;
  token: string;
  companyName: string | null;
  estateCompanyId: string;
};

/** Public lookup by token (service role — invitee is not a partner yet). */
export async function getInviteByToken(
  token: string,
): Promise<PublicInviteInfo | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const service = getServiceRoleClient();
  if (!service) return null;

  const { data, error } = await service
    .from("partner_invites")
    .select("id, email, status, token, estate_company_id")
    .eq("token", trimmed)
    .maybeSingle();

  if (error || !data) return null;

  const { data: company } = await service
    .from("estate_companies")
    .select("name")
    .eq("id", data.estate_company_id)
    .maybeSingle();

  return {
    id: data.id as string,
    email: data.email as string,
    status: data.status as PartnerInviteStatus,
    token: data.token as string,
    estateCompanyId: data.estate_company_id as string,
    companyName: (company?.name as string | null) ?? null,
  };
}

/**
 * Attach the signed-in user to the invite’s company.
 * Email must match the invite. Uses service role to upsert profile.
 */
export async function acceptPartnerInvite(params: {
  token: string;
  userId: string;
  userEmail: string | undefined;
}): Promise<{ error?: string; ok?: boolean }> {
  const service = getServiceRoleClient();
  if (!service) {
    return { error: "Server missing SUPABASE_SERVICE_ROLE_KEY." };
  }

  const invite = await getInviteByToken(params.token);
  if (!invite) return { error: "Invite not found." };
  if (invite.status === "revoked") return { error: "This invite was revoked." };
  if (invite.status === "accepted") {
    // Idempotent if already on the company
    const { data: profile } = await service
      .from("profiles")
      .select("estate_company_id, role")
      .eq("id", params.userId)
      .maybeSingle();
    if (
      profile?.estate_company_id === invite.estateCompanyId &&
      profile.role === "partner"
    ) {
      return { ok: true };
    }
    return { error: "This invite was already used." };
  }
  if (invite.status !== "pending") return { error: "Invite is not valid." };

  const userEmail = params.userEmail ? normalizeEmail(params.userEmail) : "";
  if (!userEmail || userEmail !== normalizeEmail(invite.email)) {
    return {
      error: `Sign in with ${invite.email} to accept this invite.`,
    };
  }

  // Don't steal someone already linked to another company as partner
  const { data: existing } = await service
    .from("profiles")
    .select("estate_company_id, role")
    .eq("id", params.userId)
    .maybeSingle();

  if (
    existing?.role === "partner" &&
    existing.estate_company_id &&
    existing.estate_company_id !== invite.estateCompanyId
  ) {
    return {
      error: "This account is already linked to another partner company.",
    };
  }

  if (existing?.role === "admin") {
    return {
      error: "Admin accounts can’t join a partner company via invite.",
    };
  }

  const { error: profileError } = await service.from("profiles").upsert(
    {
      id: params.userId,
      role: "partner",
      estate_company_id: invite.estateCompanyId,
    },
    { onConflict: "id" },
  );

  if (profileError) return { error: profileError.message };

  const { error: inviteError } = await service
    .from("partner_invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id)
    .eq("status", "pending");

  if (inviteError) return { error: inviteError.message };
  return { ok: true };
}

/**
 * Create auth user (if needed) + accept invite. For invitees without an account.
 */
export async function createAccountAndAcceptInvite(params: {
  token: string;
  password: string;
  displayName?: string;
}): Promise<{ error?: string; email?: string; ok?: boolean }> {
  const service = getServiceRoleClient();
  if (!service) {
    return { error: "Server missing SUPABASE_SERVICE_ROLE_KEY." };
  }

  const password = params.password;
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const invite = await getInviteByToken(params.token);
  if (!invite) return { error: "Invite not found." };
  if (invite.status !== "pending") {
    return { error: "This invite is no longer valid." };
  }

  const email = normalizeEmail(invite.email);

  // Find existing auth user by email
  let userId: string | null = null;
  try {
    const { data: listed } = await service.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const found = listed?.users?.find(
      (u) => u.email && normalizeEmail(u.email) === email,
    );
    if (found) userId = found.id;
  } catch {
    // fall through to create
  }

  if (userId) {
    const { data: existing } = await service
      .from("profiles")
      .select("estate_company_id, role")
      .eq("id", userId)
      .maybeSingle();

    if (existing?.role === "admin") {
      return { error: "Admin accounts can’t join a partner company via invite." };
    }
    if (
      existing?.role === "partner" &&
      existing.estate_company_id &&
      existing.estate_company_id !== invite.estateCompanyId
    ) {
      return {
        error: "An account with this email is already linked to another company. Sign in to manage it.",
        email,
      };
    }
  }

  if (!userId) {
    const { data: created, error: createError } =
      await service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: params.displayName
          ? { display_name: params.displayName }
          : undefined,
      });
    if (createError || !created.user) {
      return { error: createError?.message ?? "Could not create account." };
    }
    userId = created.user.id;
  } else {
    // User may already exist from generateLink({ type: "invite" }) when we
    // emailed the one-click login link — set their password instead.
    const { error: updateError } = await service.auth.admin.updateUserById(
      userId,
      {
        password,
        email_confirm: true,
        user_metadata: params.displayName
          ? { display_name: params.displayName }
          : undefined,
      },
    );
    if (updateError) {
      return { error: updateError.message };
    }
  }

  const { error: profileError } = await service.from("profiles").upsert(
    {
      id: userId,
      role: "partner",
      estate_company_id: invite.estateCompanyId,
      ...(params.displayName?.trim()
        ? { display_name: params.displayName.trim() }
        : {}),
    },
    { onConflict: "id" },
  );
  if (profileError) return { error: profileError.message };

  const { error: inviteError } = await service
    .from("partner_invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id)
    .eq("status", "pending");

  if (inviteError) return { error: inviteError.message };

  return { ok: true, email };
}
