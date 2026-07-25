"use client";

import type { Apartment } from "types";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { statusMessageKey } from "@/lib/i18n/messages";

const STYLES: Record<NonNullable<Apartment["status"]>, string> = {
  draft: "bg-sand text-muted",
  pending_review: "bg-sand-deep/50 text-ocean-deep",
  available: "bg-palm-soft text-palm",
  reserved: "bg-sand-deep/60 text-ocean-deep",
  rented: "bg-line text-muted",
};

export function StatusChip({ status }: { status?: Apartment["status"] | null }) {
  const { t } = useLocale();
  const value = status ?? "draft";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${STYLES[value] ?? STYLES.draft}`}
    >
      {t(statusMessageKey(value))}
    </span>
  );
}
