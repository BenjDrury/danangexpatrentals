import type { Metadata } from "next";
import Link from "next/link";
import { ActivitiesRegistry } from "@/app/components/guide/ActivitiesRegistry";
import { CtaButton } from "@/app/components/CtaButton";
import { Section, SectionHero } from "@/app/components/sections";
import { getActivities } from "@/lib/data";

export const metadata: Metadata = {
  title: "Things to do in Da Nang — Living guide | Da Nang Expat Rentals",
  description:
    "Activity registry for Da Nang: surf lessons, yoga, day trips, food, and outdoors — with typical prices for expats and remote workers.",
};

export default async function ActivitiesRegistryPage() {
  const activities = await getActivities();

  return (
    <div className="min-h-screen bg-foam">
      <SectionHero
        variant="page"
        title="Activity registry"
        subtitle="Surf, wellness, food, day trips, and outdoor loops — practical ideas with ballpark prices."
      />

      <Section bg="bg-foam" className="!pt-4 sm:!pt-6">
        <Link
          href="/moving-guide"
          className="text-sm font-medium text-muted transition hover:text-ocean"
        >
          ← Living in Da Nang
        </Link>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
          Pulled from our database so we can keep adding verified options. Treat prices as
          orientation, not quotes.
        </p>

        {activities.length > 0 ? (
          <ActivitiesRegistry activities={activities} />
        ) : (
          <div className="mt-10 rounded-2xl border border-line bg-white px-6 py-10">
            <p className="text-muted">
              No activities published yet. Run the Supabase migration{" "}
              <code className="text-sm">11-coworking-activities.sql</code> or add rows in the{" "}
              <code className="text-sm">activities</code> table.
            </p>
          </div>
        )}

        <div className="mt-12 flex flex-wrap gap-3">
          <CtaButton href="/moving-guide/daily-life" variant="secondary">
            Daily life guide
          </CtaButton>
          <CtaButton href="/moving-guide/coworking" variant="secondary">
            Coworking registry
          </CtaButton>
        </div>
      </Section>
    </div>
  );
}
