import Link from "next/link";
import type { Area } from "types";
import { Section } from "@/app/components/sections";
import { TRANSPORT_COSTS_BLOG_URL } from "@/app/lib/links";
import { isEmpty, normalizeYesNo, parseTransportModes } from "@/lib/area-utils";

type AreaConvenienceProps = { area: Area };

function formatTransportLabel(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const WITHIN_5KM: { key: keyof Area; label: string }[] = [
  { key: "within5km_beach", label: "Beach" },
  { key: "within5km_hospital", label: "Hospital" },
  { key: "within5km_international_school", label: "International school" },
  { key: "within5km_supermarket", label: "Supermarket" },
  { key: "within5km_coworking", label: "Coworking" },
];

export function AreaConvenience({ area }: AreaConvenienceProps) {
  const withinTiles = WITHIN_5KM.filter(({ key }) => {
    const v = area[key] as string | null | undefined;
    if (isEmpty(v)) return false;
    return normalizeYesNo(v as string) === true;
  }).map(({ label }) => label);

  const transportModes = parseTransportModes(area.transport_primary_modes);
  const safetyNotes = !isEmpty(area.safety_notes) ? area.safety_notes! : null;
  const noiseNotes = !isEmpty(area.noise_air_quality_notes)
    ? area.noise_air_quality_notes!
    : null;
  const weatherRisk = !isEmpty(area.flood_typhoon_risk)
    ? area.flood_typhoon_risk!
    : null;

  const hasAny =
    withinTiles.length > 0 ||
    transportModes.length > 0 ||
    safetyNotes ||
    noiseNotes ||
    weatherRisk;

  if (!hasAny) return null;

  return (
    <Section bg="bg-white">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-ocean">Living here</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
          What&apos;s nearby & how to get around
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          Amenities within about 5km, transport options, and a few practical notes.
        </p>
      </div>

      {withinTiles.length > 0 && (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {withinTiles.map((label) => (
            <li
              key={label}
              className="rounded-2xl border border-line bg-foam p-5 shadow-[0_6px_24px_rgba(42,42,40,0.03)]"
            >
              <p className="text-sm text-muted">Within 5km</p>
              <p className="mt-1 font-display text-lg font-semibold text-charcoal">{label}</p>
            </li>
          ))}
        </ul>
      )}

      <div className={`grid gap-4 sm:grid-cols-2 ${withinTiles.length > 0 ? "mt-4" : "mt-10"}`}>
        {transportModes.length > 0 && (
          <div className="rounded-2xl border border-line bg-foam p-6 shadow-[0_6px_24px_rgba(42,42,40,0.03)]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-lg font-semibold text-charcoal">Getting around</h3>
              {TRANSPORT_COSTS_BLOG_URL && (
                <Link
                  href={TRANSPORT_COSTS_BLOG_URL}
                  className="text-sm font-medium text-ocean transition hover:text-ocean-deep"
                >
                  Transport costs →
                </Link>
              )}
            </div>
            <p className="mt-3 text-base leading-relaxed text-muted">
              {transportModes.map(formatTransportLabel).join(" · ")}
            </p>
          </div>
        )}

        {(safetyNotes || noiseNotes) && (
          <div className="rounded-2xl border border-line bg-foam p-6 shadow-[0_6px_24px_rgba(42,42,40,0.03)]">
            <h3 className="font-display text-lg font-semibold text-charcoal">Safety & noise</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {[safetyNotes, noiseNotes].filter(Boolean).join(" ")}
            </p>
          </div>
        )}

        {weatherRisk && (
          <div className="rounded-2xl border border-line bg-foam p-6 shadow-[0_6px_24px_rgba(42,42,40,0.03)]">
            <h3 className="font-display text-lg font-semibold text-charcoal">Weather risk</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{weatherRisk}</p>
          </div>
        )}
      </div>
    </Section>
  );
}
