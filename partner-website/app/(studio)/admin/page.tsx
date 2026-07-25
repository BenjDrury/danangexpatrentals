import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export default async function AdminIndexPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/unauthorized");
  redirect("/admin/approvals");
}
