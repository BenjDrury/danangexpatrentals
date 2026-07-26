"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { statusMessageKey } from "@/lib/i18n/messages";
import {
  listingDisplayStatus,
  type ListingDisplayStatus,
} from "@/lib/listing-status";

const STYLES: Record<ListingDisplayStatus, string> = {
  draft: "bg-sand text-muted",
  rejected: "bg-coral-soft text-coral",
  pending_review: "bg-sand-deep/50 text-ocean-deep",
  available: "bg-palm-soft text-palm",
  reserved: "bg-sand-deep/60 text-ocean-deep",
  rented: "bg-line text-muted",
};

type Props = {
  status?: string | null;
  /** When set, chip shows Rejected instead of Draft. */
  rejectionNote?: string | null;
};

export function StatusChip({ status, rejectionNote }: Props) {
  const { t } = useLocale();
  const value = listingDisplayStatus(status, rejectionNote);
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${STYLES[value]}`}
    >
      {t(statusMessageKey(value))}
    </span>
  );
}
