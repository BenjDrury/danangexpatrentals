import { requireStudioCompany } from "@/lib/auth";
import { GuidesView } from "./GuidesView";

export default async function GuidesPage() {
  await requireStudioCompany();

  return <GuidesView />;
}
