import type { Metadata } from "next";
import { listingPriceLabel } from "types";
import { ConciergeForm } from "../components/ConciergeForm";
import { TrackedLink } from "../components/TrackedLink";
import { Section, SectionHero } from "../components/sections";
import { WHATSAPP_URL } from "../lib/contact-links";
import { areaDisplayName } from "@/lib/area-utils";
import { getApartmentById, getAreaById } from "@/lib/data";
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
  const preferredArea =
    typeof params.preferred_area === "string" ? params.preferred_area : "";
  const areaId = typeof params.areaId === "string" ? params.areaId : undefined;
  const apartmentId =
    typeof params.apartmentId === "string" ? params.apartmentId : undefined;

  const apartment = apartmentId ? await getApartmentById(apartmentId) : null;
  const listingArea = apartment
    ? await getAreaById(apartment.area_id)
    : areaId
      ? await getAreaById(areaId)
      : null;
  const listingAreaName = listingArea
    ? areaDisplayName(listingArea)
    : preferredArea || undefined;

  const isListingRequest = Boolean(apartment);
  const heroTitle = isListingRequest
    ? "Request this apartment"
    : "Tell us what you need";
  const heroSubtitle = isListingRequest
    ? "We’ll check availability and get back within 24 hours — free, calm, and no obligation."
    : "Share a few details and we’ll send thoughtful apartment options within 24 hours — free, calm, and no obligation. Short stays and longer leases welcome.";

  return (
    <div className="min-h-screen bg-foam">
      <SectionHero variant="page" title={heroTitle} subtitle={heroSubtitle} />

      <Section bg="bg-foam">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal">
              How to reach us
            </h2>
            <ul className="mt-8 space-y-8">
              <li>
                <h3 className="font-display text-lg font-semibold text-charcoal">
                  {isListingRequest ? "This request" : "Concierge form"}
                </h3>
                <p className="mt-2 text-muted leading-relaxed">
                  {isListingRequest
                    ? "You’re asking about a specific verified listing. We’ll confirm availability and next steps."
                    : "Best when you want to share budget, dates, and neighbourhood preferences in one place."}
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
                  {isListingRequest
                    ? "We reply within 24 hours about this home — and can suggest alternatives if it’s taken."
                    : "We reply within 24 hours with a shortlist of verified options — never a flood of random listings."}
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
              {isListingRequest ? "Request this home" : "Get matched"}
            </h2>
            <p className="mt-3 text-muted">Free. No spam. No obligation.</p>
            <div className="mt-8">
              <ConciergeForm
                initialPreferredArea={listingAreaName || preferredArea}
                initialAreaId={apartment?.area_id ?? areaId}
                initialApartmentId={apartment?.id ?? apartmentId}
                listingTitle={apartment?.title}
                listingPriceLabel={apartment ? listingPriceLabel(apartment) : undefined}
              />
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
