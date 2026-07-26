import Image from "next/image";
import type { Area } from "types";
import { Section } from "@/app/components/sections";
import {
  formatTenantProfile,
  parseIntensity,
  titleCasePhrase,
} from "@/lib/area-display";
import { areaDisplayName, getWhoTags, isEmpty } from "@/lib/area-utils";
import { InsightCard, LevelMeter, MeterCard, TagChip } from "./AreaMeters";

type AreaRightForYouProps = { area: Area };

export function AreaRightForYou({ area }: AreaRightForYouProps) {
  const whoTags = getWhoTags(area.who).map(titleCasePhrase);
  const profileLabel = formatTenantProfile(area.tenant_profile_tag);
  const community = parseIntensity(area.expat_community_presence);

  const weatherLevel = parseIntensity(area.flood_typhoon_risk);
  const weatherNote =
    !isEmpty(area.flood_typhoon_risk) && !weatherLevel
      ? area.flood_typhoon_risk!
      : null;

  const insights: {
    title: string;
    level?: ReturnType<typeof parseIntensity>;
    note?: string | null;
  }[] = [];

  if (!isEmpty(area.safety_notes)) {
    insights.push({
      title: "Safety",
      level: parseIntensity(area.safety_notes),
      note: area.safety_notes,
    });
  }
  if (!isEmpty(area.noise_air_quality_notes)) {
    insights.push({
      title: "Noise & air",
      level: parseIntensity(area.noise_air_quality_notes),
      note: area.noise_air_quality_notes,
    });
  }
  if (weatherLevel || weatherNote) {
    insights.push({
      title: "Weather risk",
      level: weatherLevel,
      note: weatherNote,
    });
  }

  const hasBestFor = whoTags.length > 0 || profileLabel != null || community != null;
  if (!hasBestFor && insights.length === 0) return null;

  const gallery = area.images?.filter(Boolean) ?? [];
  const sideImage = gallery.length > 1 ? gallery[1]! : gallery[0] ?? null;

  return (
    <Section bg="bg-white">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-ocean">A good fit?</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
          Who {areaDisplayName(area)} suits — and what to know
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          A quick read on lifestyle fit, plus the practical things to keep in mind.
        </p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr,minmax(280px,360px)] lg:items-start">
        <div className="space-y-4">
          {hasBestFor && (
            <div className="rounded-2xl border border-line bg-foam p-6 shadow-[0_6px_24px_rgba(42,42,40,0.03)]">
              <h3 className="font-display text-lg font-semibold text-charcoal">Best for</h3>
              {(whoTags.length > 0 || profileLabel) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {whoTags.map((label) => (
                    <TagChip key={label}>{label}</TagChip>
                  ))}
                  {profileLabel && <TagChip>{profileLabel}</TagChip>}
                </div>
              )}
              {community && (
                <div className="mt-5 max-w-xs">
                  <MeterCard label="Expat community" className="!shadow-none border-line/70 bg-white">
                    <LevelMeter level={community} />
                  </MeterCard>
                </div>
              )}
            </div>
          )}

          {insights.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {insights.map((item) => (
                <InsightCard
                  key={item.title}
                  title={item.title}
                  level={item.level}
                  note={item.note}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-foam p-6">
              <p className="text-sm text-muted">No major tradeoffs noted for this area.</p>
            </div>
          )}
        </div>

        {sideImage && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand lg:sticky lg:top-24">
            <Image
              src={sideImage}
              alt=""
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 360px, 100vw"
            />
          </div>
        )}
      </div>
    </Section>
  );
}
