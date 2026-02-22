import type { Metadata } from "next";
import { SectionHero } from "../components/sections";

export const metadata: Metadata = {
  title: "Moving to Da Nang — Guide | Da Nang Expat Rentals",
  description: "A guide for expats and remote workers moving to Da Nang, Vietnam.",
};

export default function MovingGuidePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SectionHero
        variant="page"
        title="Moving to Da Nang guide"
        subtitle="Coming soon. We're putting together a practical guide for expats and remote workers."
      />
    </div>
  );
}
