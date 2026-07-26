import type { Metadata } from "next";
import Link from "next/link";
import { PartnerApplyForm } from "./PartnerApplyForm";
import { Section, SectionHero } from "@/app/components/sections";
import { TrackedLink } from "@/app/components/TrackedLink";
import { getAreas } from "@/lib/data";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Apply to partner",
  description:
    "Apply to work with Da Nang Expat Rentals. We introduce international renters to agents and owners with available apartments.",
  path: "/partners/apply",
});

export const revalidate = 300;

export default async function PartnerApplyPage() {
  const areas = await getAreas();
  const areaOptions = areas
    .map((a) => ({ id: a.id, name: a.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-foam">
      <SectionHero
        variant="page"
        title="Apply to partner"
        subtitle="Tell us a little about your inventory and how you work. If it’s a fit, we’ll set you up in Partner Studio."
      />

      <Section bg="bg-foam">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal">
              What we’re looking for
            </h2>
            <ul className="mt-8 space-y-5 text-base leading-relaxed text-muted">
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ocean" aria-hidden />
                <span>Apartments in Da Nang that are actually available.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ocean" aria-hidden />
                <span>Clear pricing and honest photos.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ocean" aria-hidden />
                <span>Agents, owners, and managers who want thoughtful introductions — not volume spam.</span>
              </li>
            </ul>

            <p className="mt-12 border-t border-line pt-6 text-sm text-muted">
              Already a partner?{" "}
              <TrackedLink
                href={
                  process.env.NEXT_PUBLIC_PARTNER_URL?.replace(/\/$/, "") ||
                  "http://localhost:3002"
                }
                event="partner_studio_clicked"
                eventProps={{ source: "partner_apply_page" }}
                className="font-medium text-ocean transition hover:text-ocean-deep"
              >
                Open Partner Studio →
              </TrackedLink>
            </p>

            <p className="mt-4 text-sm">
              <Link href="/partners" className="font-medium text-ocean transition hover:text-ocean-deep">
                ← Back to partners
              </Link>
            </p>
          </div>

          <div className="rounded-soft border border-line bg-white p-8 sm:p-10">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal">
              Application
            </h2>
            <p className="mt-3 text-muted">Takes about two minutes. We’ll reply if it’s a fit.</p>
            <div className="mt-8">
              <PartnerApplyForm areas={areaOptions} />
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
