import type { Metadata } from "next";
import Link from "next/link";
import { CoworkingRegistry } from "@/app/components/guide/CoworkingRegistry";
import { CtaButton } from "@/app/components/CtaButton";
import { Section, SectionHero } from "@/app/components/sections";
import { getCoworkingSpaces } from "@/lib/data";

export const metadata: Metadata = {
  title: "Coworking in Da Nang — Living guide | Da Nang Expat Rentals",
  description:
    "Coworking and laptop-friendly work spots in Da Nang for remote workers — day passes, monthly desks, and neighbourhood notes.",
};

export default async function CoworkingRegistryPage() {
  const spaces = await getCoworkingSpaces();

  return (
    <div className="min-h-screen bg-foam">
      <SectionHero
        variant="page"
        title="Coworking registry"
        subtitle="Places and patterns for getting work done in Da Nang — from café circuits to quieter monthly desks."
      />

      <Section bg="bg-foam" className="!pt-4 sm:!pt-6">
        <Link
          href="/moving-guide"
          className="text-sm font-medium text-muted transition hover:text-ocean"
        >
          ← Living in Da Nang
        </Link>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
          Entries come from our database and will grow as we verify more spots. Prices are
          approximate — always confirm with the venue.
        </p>

        {spaces.length > 0 ? (
          <CoworkingRegistry spaces={spaces} />
        ) : (
          <div className="mt-10 rounded-2xl border border-line bg-white px-6 py-10">
            <p className="text-muted">
              No coworking entries published yet. Run the Supabase migration{" "}
              <code className="text-sm">11-coworking-activities.sql</code> or add rows in the{" "}
              <code className="text-sm">coworking_spaces</code> table.
            </p>
          </div>
        )}

        <div className="mt-12 flex flex-wrap gap-3">
          <CtaButton href="/moving-guide/remote-work" variant="secondary">
            Remote work tips
          </CtaButton>
          <CtaButton href="/moving-guide/activities" variant="secondary">
            Activity registry
          </CtaButton>
        </div>
      </Section>
    </div>
  );
}
