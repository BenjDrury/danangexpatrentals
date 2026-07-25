import { requireAdmin } from "@/lib/auth";
import { getServiceRoleClient } from "@/lib/supabase/server";
import type { Apartment } from "types";

export type PendingApprovalRow = {
  listing: Apartment;
  companyName: string | null;
  companyId: string | null;
};

export type ListPendingApprovalsResult = {
  rows: PendingApprovalRow[];
  missingServiceRole?: boolean;
};

/**
 * Listings awaiting admin go-live approval.
 * Service role preferred so admins see all companies even without impersonation.
 */
export async function listPendingApprovals(): Promise<ListPendingApprovalsResult> {
  const admin = await requireAdmin();
  if (!admin) return { rows: [] };

  const service = getServiceRoleClient();
  if (!service) return { rows: [], missingServiceRole: true };

  const { data: apts, error } = await service
    .from("apartments")
    .select("*")
    .eq("status", "pending_review")
    .order("live_requested_at", { ascending: true, nullsFirst: false });

  if (error || !apts?.length) return { rows: [] };

  const companyIds = [
    ...new Set(
      apts
        .map((a) => a.estate_company_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const companyNameById = new Map<string, string>();
  if (companyIds.length) {
    const { data: companies } = await service
      .from("estate_companies")
      .select("id, name")
      .in("id", companyIds);
    for (const c of companies ?? []) {
      companyNameById.set(c.id, c.name);
    }
  }

  return {
    rows: apts.map((apt) => {
      const companyId = (apt.estate_company_id as string | null) ?? null;
      return {
        listing: apt as Apartment,
        companyId,
        companyName: companyId ? (companyNameById.get(companyId) ?? null) : null,
      };
    }),
  };
}
