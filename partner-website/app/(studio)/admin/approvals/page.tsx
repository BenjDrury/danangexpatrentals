import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { listPendingApprovals } from "@/lib/data/approvals";
import { ApprovalsView } from "./ApprovalsView";

export default async function AdminApprovalsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/unauthorized");

  const { rows, missingServiceRole } = await listPendingApprovals();

  return <ApprovalsView rows={rows} missingServiceRole={missingServiceRole} />;
}
