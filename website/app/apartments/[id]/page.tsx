import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect, notFound } from "next/navigation";
import {
  agencyFeeLabel,
  formatMonthsOfRent,
  listingPriceLabel,
  propertyTypeLabel,
  utilitiesIncludedLabel,
} from "types";
import { TrackListingView } from "@/app/components/TrackListingView";
import { ApartmentGallery } from "@/app/components/area/ApartmentGallery";
import { ApartmentInquiryLink } from "@/app/components/area/ApartmentInquiryLink";
import { ListingGuides } from "@/app/components/area/ListingGuides";
import { CONTENT_CONTAINER, SECTION_PADDING } from "../../lib/constants";
import { getApartmentById, getAreaById } from "@/lib/data";
import {
  apartmentPath,
  areaDisplayName,
  areaPath,
  listingSeoTitle,
} from "@/lib/area-utils";
import { absoluteUrl, breadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const apartment = await getApartmentById(id);
  if (!apartment) return { title: "Apartment not found" };
  const area = await getAreaById(apartment.area_id);
  const areaName = area ? areaDisplayName(area) : "Da Nang";
  const priceLabel = listingPriceLabel(apartment);
  const bedLabel =
    apartment.bedrooms === 0
      ? "Studio"
      : `${apartment.bedrooms} bed${apartment.bedrooms !== 1 ? "s" : ""}`;
  const description =
    apartment.description?.trim() ||
    `${apartment.title} in ${areaName}. ${priceLabel}. ${bedLabel}. Verified listing for expats in Da Nang.`;
  const path = apartmentPath(apartment);
  const image =
    apartment.main_image?.trim() ||
    apartment.images?.find((url) => Boolean(url?.trim())) ||
    null;

  return buildPageMetadata({
    title: listingSeoTitle(apartment.title, areaName),
    description,
    path,
    image,
    imageAlt: `${apartment.title} in ${areaName}`,
  });
}

export default async function ApartmentPage({ params }: Props) {
  const { id } = await params;
  const apartment = await getApartmentById(id);
  if (!apartment) notFound();

  const canonicalKey = apartment.public_slug?.trim() || apartmentPath(apartment).replace(/^\/apartments\//, "");
  if (id !== canonicalKey) {
    permanentRedirect(apartmentPath(apartment));
  }

  const area = await getAreaById(apartment.area_id);
  const allImages = [apartment.main_image, ...apartment.images].filter(Boolean);
  const areaName = area ? areaDisplayName(area) : "Da Nang";
  const areaHref = area ? areaPath(area) : "/apartments";
  const priceLabel = listingPriceLabel(apartment);
  const listingPath = apartmentPath(apartment);
  const listingJsonLd = {
    "@context": "https://schema.org",
    "@type": "Apartment",
    name: apartment.title,
    description:
      apartment.description?.trim() ||
      `${apartment.title} in ${areaName}. ${priceLabel}.`,
    image: allImages.map((url) => absoluteUrl(url)),
    url: absoluteUrl(listingPath),
    numberOfRooms: apartment.bedrooms,
    ...(apartment.size_sqm != null
      ? {
          floorSize: {
            "@type": "QuantitativeValue",
            value: apartment.size_sqm,
            unitCode: "MTK",
          },
        }
      : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: areaName,
      addressRegion: "Da Nang",
      addressCountry: "VN",
    },
    offers: {
      "@type": "Offer",
      price: apartment.price_amount ?? apartment.price_usd ?? apartment.price,
      priceCurrency:
        apartment.price_currency ??
        (apartment.price_usd != null ? "USD" : "VND"),
      availability: "https://schema.org/InStock",
      url: absoluteUrl(listingPath),
    },
  };
  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Apartments", path: "/apartments" },
    ...(area
      ? [{ name: areaName, path: areaHref }]
      : []),
    { name: apartment.title, path: listingPath },
  ]);

  return (
    <div className="min-h-screen bg-foam">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <TrackListingView apartmentId={apartment.id} areaId={apartment.area_id} />
      <section className={`w-full ${SECTION_PADDING} bg-white pt-28 sm:pt-36`}>
        <div className={CONTENT_CONTAINER}>
        <Link
          href={area ? areaHref : "/apartments"}
          className="text-sm font-medium text-ocean hover:text-ocean"
        >
          ← {area ? `Back to ${areaName}` : "All apartments"}
        </Link>

        <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:gap-12">
          <ApartmentGallery
            title={apartment.title}
            images={allImages}
            apartmentId={apartment.id}
            areaId={apartment.area_id}
          />

          {/* Details */}
          <div className="w-full lg:max-w-md lg:shrink-0">
            <h1 className="text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
              {apartment.title}
            </h1>
            {area && (
              <Link
                href={areaHref}
                className="mt-2 inline-block text-ocean hover:text-ocean font-medium"
              >
                {areaName}
              </Link>
            )}
            <p className="mt-4 text-2xl font-semibold text-ocean">
              {listingPriceLabel(apartment)}
            </p>

            <ul className="mt-6 space-y-2 text-charcoal/80">
              {apartment.property_type ? (
                <li>
                  <strong>Type:</strong> {propertyTypeLabel(apartment.property_type)}
                </li>
              ) : null}
              <li>
                <strong>Bedrooms:</strong> {apartment.bedrooms}
              </li>
              {apartment.bathrooms != null && (
                <li>
                  <strong>Bathrooms:</strong> {apartment.bathrooms}
                </li>
              )}
              {apartment.size_sqm != null && (
                <li>
                  <strong>Size:</strong> {apartment.size_sqm} m²
                </li>
              )}
              {apartment.available_from && (
                <li>
                  <strong>Available from:</strong>{" "}
                  {new Date(apartment.available_from).toLocaleDateString(
                    "en-GB",
                    { day: "numeric", month: "long", year: "numeric" }
                  )}
                </li>
              )}
              {apartment.min_lease_months != null && (
                <li>
                  <strong>Min. lease:</strong>{" "}
                  {formatMonthsOfRent(apartment.min_lease_months)}
                </li>
              )}
              {apartment.deposit_months != null && (
                <li>
                  <strong>Deposit:</strong>{" "}
                  {formatMonthsOfRent(apartment.deposit_months)} of rent
                </li>
              )}
              {apartment.agency_fee_months != null && (
                <li>
                  <strong>Agency fee:</strong>{" "}
                  {apartment.agency_fee_months === 0
                    ? agencyFeeLabel(0)
                    : `${agencyFeeLabel(apartment.agency_fee_months)} of rent`}
                </li>
              )}
              {apartment.utilities_included ? (
                <li>
                  <strong>Utilities:</strong>{" "}
                  {utilitiesIncludedLabel(apartment.utilities_included)}
                </li>
              ) : null}
            </ul>

            {apartment.features.length > 0 && (
              <div className="mt-6">
                <strong className="text-charcoal">Features:</strong>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {apartment.features.map((f) => (
                    <li
                      key={f}
                      className="rounded-lg bg-sand px-3 py-1 text-sm text-charcoal/80"
                    >
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {apartment.description && (
              <div className="mt-6">
                <strong className="text-charcoal">Description</strong>
                <p className="mt-2 text-charcoal/80 whitespace-pre-wrap">
                  {apartment.description}
                </p>
              </div>
            )}

            <ApartmentInquiryLink
              href="/contact"
              apartmentId={apartment.id}
              areaId={area?.id}
              className="mt-8 inline-flex w-full justify-center rounded-quieter bg-ocean px-6 py-4 text-base font-semibold text-white transition hover:bg-ocean-deep"
            />
          </div>
        </div>
        </div>
      </section>

      <ListingGuides
        apartmentId={apartment.id}
        areaId={area?.id}
        areaName={area ? areaName : undefined}
        areaHref={area ? areaHref : undefined}
      />
    </div>
  );
}
