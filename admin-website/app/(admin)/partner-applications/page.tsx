import { getPartnerApplications } from "@/lib/data/partner-applications";
import { PartnerApplicationsList } from "./PartnerApplicationsList";

export default async function AdminPartnerApplicationsPage() {
  const applications = await getPartnerApplications();

  return (
    <div className="animate-fade-up">
      <h1 className="page-title">Partner applications</h1>
      <p className="page-lead">
        Applications from agents and owners via the public partner apply form.
        Use WhatsApp or email to reply with a prefilled message.
      </p>

      <PartnerApplicationsList applications={applications} />
    </div>
  );
}
