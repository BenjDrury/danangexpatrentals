import Link from "next/link";
import type { Area } from "types";
import { Section } from "@/app/components/sections";
import { TRANSPORT_COSTS_BLOG_URL } from "@/app/lib/links";
import { isEmpty, normalizeYesNo, parseTransportModes } from "@/lib/area-utils";

type AreaConvenienceProps = { area: Area };

/** Capitalize first letter only, so "DanaBus" / "Grab" stay correct. */
function formatTransportLabel(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Tile({
  label,
  icon,
}: {
  label: string;
  icon?: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-teal-200/60 hover:shadow-md">
      {icon && (
        <span
          className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl transition group-hover:bg-teal-50"
          aria-hidden
        >
          {icon}
        </span>
      )}
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-1.5 font-semibold text-teal-700">Nearby</div>
    </div>
  );
}

const WITHIN_5KM: { key: keyof Area; label: string; icon: string }[] = [
  { key: "within5km_beach", label: "Beach (within 5km)", icon: "🏖️" },
  { key: "within5km_hospital", label: "Hospital (5km)", icon: "🏥" },
  {
    key: "within5km_international_school",
    label: "Int’l school (5km)",
    icon: "🏫",
  },
  { key: "within5km_supermarket", label: "Supermarket (5km)", icon: "🛒" },
  { key: "within5km_coworking", label: "Coworking (5km)", icon: "💻" },
];

export function AreaConvenience({ area }: AreaConvenienceProps) {
  const withinTiles = WITHIN_5KM.filter(({ key }) => {
    const v = area[key] as string | null | undefined;
    if (isEmpty(v)) return false;
    return normalizeYesNo(v as string) === true;
  }).map(({ key, label, icon }) => ({ label, icon }));

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
    <Section bg="bg-slate-50/80">
      <p className="text-sm font-medium uppercase tracking-wider text-teal-600">
        Living here
      </p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        What&apos;s nearby & how to get around
      </h2>
      <p className="mt-2 max-w-2xl text-slate-600">
        Amenities within 5km, transport options, and things to keep in mind.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {withinTiles.map((t) => (
          <Tile key={t.label} label={t.label} icon={t.icon} />
        ))}
        {transportModes.length > 0 && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-teal-200/60 hover:shadow-md sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-base">
                  🛵
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Getting around
                </span>
              </div>
              {TRANSPORT_COSTS_BLOG_URL && (
                <Link
                  href={TRANSPORT_COSTS_BLOG_URL}
                  className="text-sm font-medium text-teal-600 underline decoration-teal-300 underline-offset-2 hover:text-teal-700 hover:decoration-teal-500"
                >
                  Transport costs guide →
                </Link>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {transportModes.map((m) => (
                <span
                  key={m}
                  className="rounded-full bg-teal-50 px-3.5 py-1.5 text-sm font-medium text-teal-800"
                >
                  {formatTransportLabel(m)}
                </span>
              ))}
            </div>
          </div>
        )}
        {(safetyNotes || noiseNotes) && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-teal-200/60 hover:shadow-md">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-base">
                🛡️
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Safety & noise
              </span>
            </div>
            <div className="mt-3 text-sm leading-relaxed text-slate-700">
              {[safetyNotes, noiseNotes].filter(Boolean).join(" ")}
            </div>
          </div>
        )}
        {weatherRisk && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-base">
                🌧️
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Weather risk
              </span>
            </div>
            <div className="mt-3 text-sm leading-relaxed text-slate-700">
              {weatherRisk}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
