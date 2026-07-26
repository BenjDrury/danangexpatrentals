import type { Metadata } from "next";
import { ConciergeForm } from "../components/ConciergeForm";
import { TrackedLink } from "../components/TrackedLink";
import { Section, SectionHero } from "../components/sections";
import { WHATSAPP_URL } from "../lib/contact-links";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Get matched",
  description:
    "Tell us your budget and timing. We’ll send verified apartment options in Da Nang within 24 hours — short stays or longer.",
  path: "/contact",
});

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

export default async function ContactPage({ searchParams }: Props) {
  const params = await searchParams;
  const preferredArea = typeof params.preferred_area === "string" ? params.preferred_area : "";
  const areaId = typeof params.areaId === "string" ? params.areaId : undefined;
  const apartmentId = typeof params.apartmentId === "string" ? params.apartmentId : undefined;

  return (
    <div className="min-h-screen bg-foam">
      <SectionHero
        variant="page"
        title="Tell us what you need"
        subtitle="Share a few details and we’ll send thoughtful apartment options within 24 hours — free, calm, and no obligation. Short stays and longer leases welcome."
      />

      <Section bg="bg-foam">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal">
              How to reach us
            </h2>
            <ul className="mt-8 space-y-8">
              <li>
                <h3 className="font-display text-lg font-semibold text-charcoal">Concierge form</h3>
                <p className="mt-2 text-muted leading-relaxed">
                  Best when you want to share budget, dates, and neighbourhood preferences in one place.
                </p>
              </li>
              {WHATSAPP_URL && (
                <li>
                  <h3 className="font-display text-lg font-semibold text-charcoal">WhatsApp</h3>
                  <p className="mt-2 text-muted leading-relaxed">
                    Fastest if you’re already in Da Nang or working to a tight timeline.
                  </p>
                  <TrackedLink
                    href={WHATSAPP_URL}
                    event="whatsapp_cta_clicked"
                    eventProps={{ source: "contact_page" }}
                    className="mt-4 inline-flex rounded-quieter border border-line px-5 py-2.5 text-sm font-semibold text-charcoal transition hover:bg-sand"
                  >
                    Message on WhatsApp
                  </TrackedLink>
                </li>
              )}
              <li>
                <h3 className="font-display text-lg font-semibold text-charcoal">After you write</h3>
                <p className="mt-2 text-muted leading-relaxed">
                  We reply within 24 hours with a shortlist of verified options — never a flood of random listings.
                </p>
              </li>
            </ul>

            <p className="mt-12 border-t border-line pt-6 text-sm text-muted">
              Agent or property owner?{" "}
              <TrackedLink
                href="/partners/apply"
                event="partner_apply_cta_clicked"
                eventProps={{ source: "contact_page" }}
                className="font-medium text-ocean transition hover:text-ocean-deep"
              >
                Apply to partner →
              </TrackedLink>
            </p>
          </div>

          <div className="rounded-soft border border-line bg-white p-8 sm:p-10">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal">
              Get matched
            </h2>
            <p className="mt-3 text-muted">Free. No spam. No obligation.</p>
            <div className="mt-8">
              <ConciergeForm
                initialPreferredArea={preferredArea}
                initialAreaId={areaId}
                initialApartmentId={apartmentId}
              />
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
