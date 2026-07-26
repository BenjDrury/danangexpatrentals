import { getLeads } from "@/lib/data";
import { LeadsList } from "./LeadsList";

export default async function AdminLeadsPage() {
  const leads = await getLeads();

  return (
    <div className="animate-fade-up">
      <h1 className="page-title">Leads</h1>
      <p className="page-lead">
        Contact form submissions from the public website.
      </p>

      <LeadsList leads={leads} />
    </div>
  );
}
