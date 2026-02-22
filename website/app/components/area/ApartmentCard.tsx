"use client";

import Link from "next/link";
import Image from "next/image";
import type { Apartment } from "types";

type ApartmentCardProps = {
  apartment: Apartment;
  areaName: string;
  /** Contact URL with prefilled params (areaId, areaName, apartmentId) */
  contactHref: string;
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.894 7.48-9.817a.75.75 0 011.052-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function ApartmentCard({ apartment, areaName, contactHref }: ApartmentCardProps) {
  const bullets = [
    apartment.bedrooms ? `${apartment.bedrooms} BR` : null,
    apartment.bathrooms != null ? `${apartment.bathrooms} bath` : null,
    apartment.size_sqm != null ? `${apartment.size_sqm} m²` : null,
    apartment.min_lease_months != null
      ? `${apartment.min_lease_months}+ mo lease`
      : null,
  ].filter(Boolean) as string[];

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/apartments/${apartment.id}`} className="relative block aspect-[4/3] overflow-hidden">
        <Image
          src={apartment.main_image}
          alt={apartment.title}
          fill
          className="object-cover transition group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1 text-xs font-semibold text-teal-700 shadow-sm">
          <CheckIcon className="h-3.5 w-3.5" />
          Verified
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link
          href={`/apartments/${apartment.id}`}
          className="font-semibold text-slate-900 transition group-hover:text-teal-600"
        >
          {apartment.title}
        </Link>
        <p className="mt-1 text-lg font-medium text-teal-600">{apartment.price_display}</p>
        {bullets.length > 0 && (
          <p className="mt-2 text-sm text-slate-600">
            {bullets.join(" · ")}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={contactHref}
            className="inline-flex flex-1 justify-center rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-600"
          >
            Request this apartment
          </Link>
          <Link
            href={`/apartments/${apartment.id}`}
            className="inline-flex justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
