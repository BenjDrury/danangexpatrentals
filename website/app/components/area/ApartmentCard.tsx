"use client";

import Link from "next/link";
import Image from "next/image";
import type { Apartment } from "types";
import { formatMonthsOfRent, listingPriceLabel, propertyTypeLabel } from "types";
import { capture } from "@/lib/analytics";
import { apartmentPath } from "@/lib/area-utils";

type ApartmentCardProps = {
  apartment: Apartment;
  areaName: string;
  contactHref: string;
};

export function ApartmentCard({ apartment, areaName, contactHref }: ApartmentCardProps) {
  const meta = [
    apartment.property_type ? propertyTypeLabel(apartment.property_type) : null,
    apartment.bedrooms ? `${apartment.bedrooms} BR` : null,
    apartment.bathrooms != null ? `${apartment.bathrooms} bath` : null,
    apartment.size_sqm != null ? `${apartment.size_sqm} m²` : null,
  ].filter(Boolean) as string[];

  const availableFrom =
    apartment.available_from != null
      ? new Date(
          apartment.available_from.length === 10
            ? `${apartment.available_from}T00:00:00`
            : apartment.available_from
        )
      : null;
  const availableFromLabel =
    availableFrom && !Number.isNaN(availableFrom.getTime())
      ? availableFrom.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null;

  const termsBits = [
    apartment.min_lease_months != null
      ? `Min ${formatMonthsOfRent(apartment.min_lease_months)}`
      : null,
    apartment.deposit_months != null
      ? `Deposit ${formatMonthsOfRent(apartment.deposit_months)}`
      : null,
  ].filter(Boolean) as string[];

  const listingProps = {
    apartment_id: apartment.id,
    area_id: apartment.area_id,
    area_name: areaName,
  };

  const listingHref = apartmentPath(apartment);

  return (
    <article className="group flex flex-col">
      <Link
        href={listingHref}
        onClick={() =>
          capture("listing_card_clicked", { ...listingProps, target: "image" })
        }
        className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-sand"
      >
        <Image
          src={apartment.main_image}
          alt={apartment.title}
          fill
          className="object-cover transition duration-700 ease-soft group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </Link>
      <div className="flex flex-1 flex-col pt-5">
        <p className="text-sm font-medium text-ocean">Verified listing</p>
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <p className="text-sm text-muted">{areaName}</p>
          <p className="font-display text-lg font-semibold text-charcoal">
            {listingPriceLabel(apartment)}
          </p>
        </div>
        <Link
          href={listingHref}
          onClick={() =>
            capture("listing_card_clicked", { ...listingProps, target: "title" })
          }
          className="mt-2 font-display text-xl font-semibold tracking-tight text-charcoal transition group-hover:text-ocean"
        >
          {apartment.title}
        </Link>
        {meta.length > 0 && (
          <p className="mt-2 text-sm text-muted">{meta.join(" · ")}</p>
        )}
        {availableFromLabel ? (
          <p className="mt-2 text-sm text-muted">Available from {availableFromLabel}</p>
        ) : null}
        {termsBits.length > 0 ? (
          <p className="mt-2 text-sm text-muted">{termsBits.join(" · ")}</p>
        ) : null}
        {apartment.features?.length > 0 && (
          <p className="mt-2 text-sm text-muted">
            {apartment.features.slice(0, 3).join(" · ")}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={contactHref}
            onClick={() =>
              capture("apartment_request_clicked", listingProps)
            }
            className="inline-flex flex-1 justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: "#2f6f7e" }}
          >
            Request this home
          </Link>
          <Link
            href={listingHref}
            onClick={() =>
              capture("listing_card_clicked", { ...listingProps, target: "details" })
            }
            className="inline-flex justify-center rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-charcoal transition hover:bg-sand"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
