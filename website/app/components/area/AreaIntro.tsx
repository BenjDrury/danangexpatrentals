import Link from "next/link";
import type { Area } from "types";
import { Section } from "@/app/components/sections";
import {
  areaDisplayName,
  formatAreaPriceDisplay,
  formatAliases,
  getWhoTags,
} from "@/lib/area-utils";
import { titleCasePhrase } from "@/lib/area-display";

type AreaIntroProps = { area: Area };

/**
 * Editorial intro for area pages — unique copy from area fields for SEO depth,
 * plus internal links to apartments, guides, and matching.
 */
export function AreaIntro({ area }: AreaIntroProps) {
  const label = areaDisplayName(area);
  const aliases = formatAliases(area.aliases);
  const vibe = area.vibe?.trim();
  const who = getWhoTags(area.who).map(titleCasePhrase);
  const rent = formatAreaPriceDisplay(area) ?? area.price_range?.trim() ?? null;
  const pros = area.pros?.trim();
  const cons = area.cons?.trim();

  const sentences: string[] = [];
  sentences.push(
    `${label} is one of the neighbourhoods expats and remote workers consider when renting in Da Nang.`
  );
  if (vibe) {
    sentences.push(`The area feels ${vibe.replace(/\.$/, "").toLowerCase()}.`);
  }
  if (who.length > 0) {
    sentences.push(`It tends to suit ${who.join(", ").toLowerCase()}.`);
  }
  if (rent) {
    sentences.push(`Typical rents sit around ${rent}.`);
  }
  if (aliases) {
    sentences.push(`You may also hear it called ${aliases}.`);
  }

  return (
    <Section bg="bg-foam" className="!py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-ocean">Living here</p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
          Is {label} right for you?
        </h2>
        <div className="mt-6 space-y-4 text-base leading-relaxed text-muted sm:text-lg">
          {sentences.map((s) => (
            <p key={s}>{s}</p>
          ))}
          {pros ? (
            <p>
              <span className="font-medium text-charcoal">What people like: </span>
              {pros}
            </p>
          ) : null}
          {cons ? (
            <p>
              <span className="font-medium text-charcoal">What to weigh: </span>
              {cons}
            </p>
          ) : null}
        </div>

        <nav
          aria-label="Related pages"
          className="mt-10 flex flex-wrap gap-x-5 gap-y-3 border-t border-line pt-6 text-sm font-semibold"
        >
          <Link href="/apartments" className="text-ocean transition hover:text-ocean-deep">
            Browse apartments →
          </Link>
          <Link
            href="/moving-guide/neighbourhoods"
            className="text-ocean transition hover:text-ocean-deep"
          >
            Neighbourhoods guide →
          </Link>
          <Link
            href="/moving-guide/cost-of-living"
            className="text-ocean transition hover:text-ocean-deep"
          >
            Cost of living →
          </Link>
          <Link
            href={`/contact?areaId=${encodeURIComponent(area.id)}&preferred_area=${encodeURIComponent(label)}`}
            className="text-ocean transition hover:text-ocean-deep"
          >
            Get matched here →
          </Link>
        </nav>
      </div>
    </Section>
  );
}
