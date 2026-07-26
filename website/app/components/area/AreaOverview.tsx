import Image from "next/image";
import Link from "next/link";
import type { Area } from "types";
import { Section } from "@/app/components/sections";
import { TRANSPORT_COSTS_BLOG_URL } from "@/app/lib/links";
import {
  formatTenantProfile,
  intensityLabel,
  intensitySteps,
  parseIntensity,
  titleCasePhrase,
  type IntensityLevel,
} from "@/lib/area-display";
import {
  areaDisplayName,
  formatAreaPriceDisplay,
  formatRentRange,
  getWhoTags,
  isEmpty,
  normalizeYesNo,
  parseTransportModes,
  RENT_UNIT_TYPES,
} from "@/lib/area-utils";
import { RangeBar } from "./RangeBar";
import { TagChip } from "./AreaMeters";

type AreaOverviewProps = { area: Area };

const WITHIN_5KM: { key: keyof Area; label: string }[] = [
  { key: "within5km_beach", label: "Beach" },
  { key: "within5km_hospital", label: "Hospital" },
  { key: "within5km_international_school", label: "Int’l school" },
  { key: "within5km_supermarket", label: "Supermarket" },
  { key: "within5km_coworking", label: "Coworking" },
];

function formatTransportLabel(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function LevelInline({ level }: { level: IntensityLevel }) {
  const filled = intensitySteps(level);
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex gap-1" aria-hidden>
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: step <= filled ? "#2f6f7e" : "#e2d6c6",
            }}
          />
        ))}
      </span>
      <span className="font-medium text-charcoal">{intensityLabel(level)}</span>
    </span>
  );
}

function FactRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-line py-3.5 sm:grid-cols-[9rem_1fr] sm:gap-6 sm:items-baseline">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-sm leading-relaxed text-charcoal">{children}</dd>
    </div>
  );
}

export function AreaOverview({ area }: AreaOverviewProps) {
  const label = areaDisplayName(area);
  const whoTags = getWhoTags(area.who).map(titleCasePhrase);
  const profileLabel = formatTenantProfile(area.tenant_profile_tag);
  const community = parseIntensity(area.expat_community_presence);
  const weather = parseIntensity(area.flood_typhoon_risk);

  const nearby = WITHIN_5KM.filter(({ key }) => {
    const v = area[key] as string | null | undefined;
    if (isEmpty(v)) return false;
    return normalizeYesNo(v as string) === true;
  }).map(({ label }) => label);

  const transport = parseTransportModes(area.transport_primary_modes).map(formatTransportLabel);

  const notes: { label: string; text: string }[] = [];
  if (!isEmpty(area.safety_notes) && !parseIntensity(area.safety_notes)) {
    notes.push({ label: "Safety", text: area.safety_notes! });
  }
  if (!isEmpty(area.noise_air_quality_notes) && !parseIntensity(area.noise_air_quality_notes)) {
    notes.push({ label: "Noise & air", text: area.noise_air_quality_notes! });
  }
  if (!isEmpty(area.flood_typhoon_risk) && !weather) {
    notes.push({ label: "Weather", text: area.flood_typhoon_risk! });
  }

  const ranges = RENT_UNIT_TYPES.map(({ key, label }) => ({
    key,
    label,
    range: formatRentRange(area, key),
  })).filter((r) => r.range != null);

  const scaleMax =
    ranges.length > 0
      ? Math.max(...ranges.map((r) => (r.range ? Math.max(r.range.min, r.range.max) : 0)))
      : 0;

  const budgetLine = formatAreaPriceDisplay(area);
  const hasSnapshot = area.snapshot_date != null && String(area.snapshot_date).trim() !== "";

  const gallery = (area.images ?? []).filter(Boolean);
  const hasGallery = gallery.length > 1;

  const hasFit = whoTags.length > 0 || profileLabel != null;
  const hasFacts =
    community != null || weather != null || nearby.length > 0 || transport.length > 0;
  const hasRent = ranges.length > 0;
  const hasBody = hasFit || hasFacts || notes.length > 0 || hasRent;

  if (!hasGallery && !hasBody) return null;

  return (
    <Section bg="bg-white" className="!py-12 sm:!py-16">
      {hasGallery && (
        <div
          className={`grid gap-3 ${
            gallery.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"
          }`}
        >
          {gallery.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand ${
                gallery.length > 2 && i === 2 ? "col-span-2 sm:col-span-1" : ""
              }`}
            >
              <Image
                src={src}
                alt={`${label}, Da Nang — photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 24rem"
              />
            </div>
          ))}
        </div>
      )}

      {hasBody && (
        <div className={`max-w-3xl ${hasGallery ? "mt-10" : ""}`}>
          <p className="text-sm font-medium text-ocean">At a glance</p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
            Overview
          </h2>

          {hasFit && (
            <div className="mt-6 flex flex-wrap gap-2">
              {whoTags.map((label) => (
                <TagChip key={label}>{label}</TagChip>
              ))}
              {profileLabel && <TagChip>{profileLabel}</TagChip>}
            </div>
          )}

          {hasFacts && (
            <dl className="mt-6 border-t border-line">
              {community && (
                <FactRow label="Expat community">
                  <LevelInline level={community} />
                </FactRow>
              )}
              {weather && (
                <FactRow label="Weather risk">
                  <LevelInline level={weather} />
                </FactRow>
              )}
              {nearby.length > 0 && (
                <FactRow label="Within 5km">{nearby.join(" · ")}</FactRow>
              )}
              {transport.length > 0 && (
                <FactRow label="Getting around">
                  <span className="inline-flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span>{transport.join(" · ")}</span>
                    {TRANSPORT_COSTS_BLOG_URL && (
                      <Link
                        href={TRANSPORT_COSTS_BLOG_URL}
                        className="font-medium text-ocean transition hover:text-ocean-deep"
                      >
                        Costs →
                      </Link>
                    )}
                  </span>
                </FactRow>
              )}
            </dl>
          )}

          {notes.length > 0 && (
            <div className={`${hasFacts ? "mt-2" : "mt-6 border-t border-line"} space-y-3 pt-4`}>
              {notes.map((n) => (
                <p key={n.label} className="text-sm leading-relaxed text-muted">
                  <span className="font-medium text-charcoal">{n.label}. </span>
                  {n.text}
                </p>
              ))}
            </div>
          )}

          {hasRent && (
            <div className="mt-10">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-lg font-semibold text-charcoal">Rent ranges</h3>
                {budgetLine && <p className="text-sm text-muted">{budgetLine}</p>}
              </div>
              <div className="mt-5 space-y-4">
                {ranges.map(({ key, label, range }) =>
                  range ? (
                    <RangeBar
                      key={key}
                      label={label}
                      min={range.min}
                      max={range.max}
                      currency={range.currency}
                      scaleMax={scaleMax}
                    />
                  ) : null
                )}
              </div>
              <p className="mt-4 text-xs text-muted">
                {[
                  area.fx_usd_vnd != null && area.fx_usd_vnd > 0
                    ? `1 USD ≈ ${Math.round(area.fx_usd_vnd).toLocaleString()} ₫`
                    : null,
                  hasSnapshot
                    ? `As of ${new Date(area.snapshot_date!).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          )}
        </div>
      )}
    </Section>
  );
}
