import Link from "next/link";
import type { Area } from "types";
import { Section } from "@/app/components/sections";
import { isEmpty } from "@/lib/area-utils";

type AreaTrustFooterProps = { area: Area };

/** Kept for reuse; not shown on area pages by default. */
export function AreaTrustFooter({ area }: AreaTrustFooterProps) {
  const hasSnapshot = !isEmpty(area.snapshot_date);

  return (
    <Section bg="bg-foam" className="!py-10 sm:!py-12">
      <div className="flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <p className="text-sm leading-relaxed text-muted">
            Verified listings, transparent USD pricing, English-friendly partners.
            {hasSnapshot && (
              <>
                {" "}
                Guide updated{" "}
                {new Date(area.snapshot_date!).toLocaleDateString("en-GB", {
                  month: "short",
                  year: "numeric",
                })}
                .
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm">
          <Link href="/areas" className="font-semibold text-ocean transition hover:text-ocean-deep">
            All neighbourhoods →
          </Link>
          <Link href="/how-it-works" className="text-muted transition hover:text-charcoal">
            How it works
          </Link>
          <Link href="/avoid-scams" className="text-muted transition hover:text-charcoal">
            Avoid scams
          </Link>
        </div>
      </div>
    </Section>
  );
}
