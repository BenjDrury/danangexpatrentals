import { getAreaNames, getLeads, getOutreachApartments } from "@/lib/data";
import { LeadsList } from "./LeadsList";

export default async function AdminLeadsPage() {
  const [leads, apartments, areas] = await Promise.all([
    getLeads(),
    getOutreachApartments(),
    getAreaNames(),
  ]);

  return (
    <div className="animate-fade-up">
      <h1 className="page-title">Leads</h1>
      <p className="page-lead">
        Contact form submissions from the public website. Use WhatsApp or email
        to reply with a prefilled outreach message.
      </p>

      <LeadsList leads={leads} apartments={apartments} areas={areas} />
    </div>
  );
}
