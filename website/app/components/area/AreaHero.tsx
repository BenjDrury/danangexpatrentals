import Image from "next/image";
import Link from "next/link";
import { WHATSAPP_NUMBER } from "backend";
import type { Area } from "types";
import { CONTENT_CONTAINER } from "@/app/lib/constants";
import { formatAliases, formatExpatScore, getWhoTags, isEmpty } from "@/lib/area-utils";
import { StatBadge } from "./StatBadge";

const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}`;

type AreaHeroProps = {
  area: Area;
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

export function AreaHero({ area }: AreaHeroProps) {
  const contactWithArea = `/contact?areaId=${encodeURIComponent(area.id)}&preferred_area=${encodeURIComponent(area.name)}`;
  const expatScore = formatExpatScore(area.expat_suitability_score);
  const furnishedPct =
    area.furnished_availability_pct_est != null
      ? Math.round(clamp(area.furnished_availability_pct_est, 0, 100))
      : null;
  const leaseTerm =
    area.avg_lease_term_months != null && area.avg_lease_term_months > 0
      ? `${Math.round(area.avg_lease_term_months)} mo`
      : null;

  const images = area.images?.filter(Boolean) ?? [];
  const hasImages = images.length > 0;

  return (
    <section className="relative min-h-[50vh] overflow-hidden text-white">
      <div className="absolute inset-0 flex">
        {hasImages ? (
          images.map((src, i) => (
            <div
              key={i}
              className="relative flex-1 min-w-0"
              style={{
                clipPath: getTiltedPanelClipPath(i, images.length),
              }}
            >
              <Image
                src={src}
                alt=""
                fill
                className="object-cover object-center"
                sizes={`${100 / images.length}vw`}
                priority={i === 0}
              />
            </div>
          ))
        ) : (
          <div className="absolute inset-0 bg-slate-700" aria-hidden />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/60 to-slate-900/40 pointer-events-none" />
      <div className={`relative z-10 flex min-h-[50vh] flex-col justify-end ${CONTENT_CONTAINER} py-16 sm:py-24`}>
        <Link
          href="/areas"
          className="absolute left-6 top-6 text-sm font-medium text-white/90 hover:text-white"
        >
          ← All areas
        </Link>
        <h1 className="mt-8 text-4xl font-bold tracking-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.8),0_0_20px_rgba(0,0,0,0.5)] sm:text-5xl lg:text-6xl">
          {area.name}
        </h1>
        {formatAliases(area.aliases) && (
          <p className="mt-2 text-lg text-white/95 [text-shadow:0_1px_3px_rgba(0,0,0,0.8)] sm:text-xl">
            {formatAliases(area.aliases)}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {area.vibe?.trim() && (
            <span className="inline-flex rounded-full bg-white/20 px-3.5 py-1.5 text-sm font-medium backdrop-blur-sm [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
              {area.vibe.trim()}
            </span>
          )}
          {getWhoTags(area.who).map((label) => (
            <span
              key={label}
              className="inline-flex rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]"
            >
              {label}
            </span>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium backdrop-blur-sm">
            <CheckIcon className="h-4 w-4 text-teal-300" />
            Verified rentals
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium backdrop-blur-sm">
            <CheckIcon className="h-4 w-4 text-teal-300" />
            English-friendly
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium backdrop-blur-sm">
            <CheckIcon className="h-4 w-4 text-teal-300" />
            Transparent pricing
          </span>
        </div>
        {(expatScore || area.nightlife_intensity || furnishedPct != null || leaseTerm) && (
          <div className="mt-8 flex flex-wrap gap-4">
            {expatScore && (
              <StatBadge label="Expat score" value={expatScore} subdued />
            )}
            {!isEmpty(area.nightlife_intensity) && (
              <StatBadge
                label="Nightlife"
                value={area.nightlife_intensity!}
                subdued
              />
            )}
            {furnishedPct != null && (
              <StatBadge
                label="Furnished"
                value={`~${furnishedPct}%`}
                subdued
              />
            )}
            {leaseTerm && (
              <StatBadge label="Typical lease" value={leaseTerm} subdued />
            )}
          </div>
        )}
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href={contactWithArea}
            className="inline-flex items-center justify-center rounded-xl bg-teal-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition hover:bg-teal-600"
          >
            Get apartment matches
          </Link>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-white/60 bg-white/10 px-6 py-4 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Clip-path polygon for one panel so boundaries are slightly tilted (diagonal cut). Percentages are in the panel’s own coordinates. */
function getTiltedPanelClipPath(index: number, total: number): string {
  if (total <= 1) return "none";
  const tilt = 6; // percent: diagonal offset (top-right and bottom-left corners)
  const isFirst = index === 0;
  const isLast = index === total - 1;
  // Left edge: straight or diagonal (top inset) — x at top, x at bottom
  const leftTop = isFirst ? 0 : tilt;
  const leftBottom = isFirst ? 0 : 0;
  // Right edge: straight or diagonal (bottom inset)
  const rightTop = isLast ? 100 : 100;
  const rightBottom = isLast ? 100 : 100 - tilt;
  return `polygon(${leftTop}% 0%, ${rightTop}% 0%, ${rightBottom}% 100%, ${leftBottom}% 100%)`;
}
