import Image from "next/image";
import Link from "next/link";
import type { Area } from "types";
import { CONTENT_CONTAINER } from "@/app/lib/constants";
import { WHATSAPP_URL } from "@/app/lib/contact-links";
import { CtaButton } from "@/app/components/CtaButton";
import {
  expatScoreOutOfTen,
  formatScoreOutOfTen,
  parseIntensity,
  titleCasePhrase,
} from "@/lib/area-display";
import { areaDisplayName, formatAliases, getWhoTags } from "@/lib/area-utils";
import {
  LeaseMeter,
  LevelMeter,
  MeterCard,
  PercentMeter,
  ScoreMeter,
} from "./AreaMeters";

type AreaHeroProps = {
  area: Area;
};

export function AreaHero({ area }: AreaHeroProps) {
  const contactWithArea = `/contact?areaId=${encodeURIComponent(area.id)}&preferred_area=${encodeURIComponent(areaDisplayName(area))}`;
  const score10 = expatScoreOutOfTen(area.expat_suitability_score);
  const scoreDisplay = formatScoreOutOfTen(area.expat_suitability_score);
  const nightlife = parseIntensity(area.nightlife_intensity);
  const furnishedPct =
    area.furnished_availability_pct_est != null
      ? Math.round(Math.min(100, Math.max(0, area.furnished_availability_pct_est)))
      : null;
  const leaseMonths =
    area.avg_lease_term_months != null && area.avg_lease_term_months > 0
      ? area.avg_lease_term_months
      : null;

  const image = area.images?.find(Boolean) ?? null;
  const aliases = formatAliases(area.aliases);
  const vibe = area.vibe?.trim() ? titleCasePhrase(area.vibe.trim()) : null;
  const whoTags = getWhoTags(area.who).map(titleCasePhrase);

  const hasMeters =
    (score10 != null && scoreDisplay != null) ||
    nightlife != null ||
    furnishedPct != null ||
    leaseMonths != null;

  return (
    <section className="relative flex min-h-[70svh] items-end overflow-hidden sm:min-h-[75svh]">
      <div className="absolute inset-0">
        {image ? (
          <Image
            src={image}
            alt={`${areaDisplayName(area)}, Da Nang`}
            fill
            className="object-cover object-center animate-soft-zoom"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: "#1e4f5a" }} aria-hidden />
        )}
        <div className="hero-scrim" aria-hidden />
      </div>

      <div className={`relative z-10 w-full ${CONTENT_CONTAINER} pb-14 pt-28 sm:pb-20 sm:pt-36`}>
        <Link
          href="/areas"
          className="inline-flex text-sm font-medium hero-copy-muted transition hover:opacity-100"
        >
          ← All neighbourhoods
        </Link>

        <p className="animate-fade-up mt-6 font-display text-sm font-medium hero-copy sm:text-base">
          Neighbourhood guide
        </p>
        <h1 className="animate-fade-up-delay mt-3 font-display text-4xl font-semibold tracking-tight text-balance hero-copy sm:text-5xl lg:text-[3.5rem]">
          {areaDisplayName(area)}
        </h1>
        {(aliases || vibe) && (
          <p className="animate-fade-up-delay mt-3 max-w-xl text-lg hero-copy-muted sm:text-xl">
            {[aliases, vibe].filter(Boolean).join(" · ")}
          </p>
        )}
        {whoTags.length > 0 && (
          <p className="animate-fade-up-delay-2 mt-4 max-w-xl text-base leading-relaxed hero-copy-muted">
            Best for {whoTags.join(" · ")}
          </p>
        )}

        {hasMeters && (
          <div className="animate-fade-up-delay-2 mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {score10 != null && scoreDisplay && (
              <MeterCard label="Expat fit" tone="dark">
                <ScoreMeter score={score10} display={scoreDisplay} tone="dark" />
              </MeterCard>
            )}
            {nightlife && (
              <MeterCard label="Nightlife" tone="dark">
                <LevelMeter level={nightlife} tone="dark" />
              </MeterCard>
            )}
            {furnishedPct != null && (
              <MeterCard label="Furnished" tone="dark">
                <PercentMeter percent={furnishedPct} tone="dark" />
              </MeterCard>
            )}
            {leaseMonths != null && (
              <MeterCard label="Lease" tone="dark">
                <LeaseMeter months={leaseMonths} tone="dark" />
              </MeterCard>
            )}
          </div>
        )}

        <div className="animate-fade-up-delay-2 mt-9 flex flex-wrap gap-3">
          <CtaButton href={contactWithArea} variant="onDark">
            Get apartment matches
          </CtaButton>
          {WHATSAPP_URL && (
            <CtaButton href={WHATSAPP_URL} variant="onDarkSecondary">
              Chat on WhatsApp
            </CtaButton>
          )}
        </div>
      </div>
    </section>
  );
}
