import type { Metadata } from "next";
import { SectionHero } from "../components/sections";

export const metadata: Metadata = {
  title: "FAQ — Da Nang Expat Rentals",
  description: "Frequently asked questions about finding apartments in Da Nang.",
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SectionHero
        variant="page"
        title="FAQ"
        subtitle="Coming soon. In the meantime, get in touch via the contact page or WhatsApp."
      />
    </div>
  );
}
