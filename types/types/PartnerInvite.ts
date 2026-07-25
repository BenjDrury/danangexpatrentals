/**
 * Partner invite to join an estate company (public.partner_invites).
 */
export type PartnerInviteStatus = "pending" | "accepted" | "revoked";

export interface PartnerInvite {
  id: string;
  estate_company_id: string;
  email: string;
  invited_by: string | null;
  status: PartnerInviteStatus;
  token: string;
  created_at: string;
  accepted_at: string | null;
}
