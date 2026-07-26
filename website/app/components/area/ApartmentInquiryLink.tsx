"use client";

import Link from "next/link";
import posthog from "posthog-js";

type ApartmentInquiryLinkProps = {
  href: string;
  apartmentId: string;
  areaId?: string;
  className?: string;
};

export function ApartmentInquiryLink({ href, apartmentId, areaId, className }: ApartmentInquiryLinkProps) {
  return (
    <Link
      href={href}
      onClick={() =>
        posthog.capture("apartment_inquiry_clicked", {
          apartment_id: apartmentId,
          area_id: areaId ?? null,
          source: "apartment_detail",
        })
      }
      className={className}
    >
      Inquire about this apartment
    </Link>
  );
}
