import type { Area } from "types";
import { Section } from "@/app/components/sections";
import { isEmpty } from "@/lib/area-utils";
import { AreaLocationDebug } from "./AreaLocationDebug";
import { AreaMapClient } from "./AreaMapClient";

type AreaLocationProps = { area: Area };

export function AreaLocation({ area }: AreaLocationProps) {
  const hasCentroid =
    area.centroid_lat != null &&
    area.centroid_lon != null &&
    Number.isFinite(area.centroid_lat) &&
    Number.isFinite(area.centroid_lon);

  const districts = !isEmpty(area.admin_districts_pre2025) ? area.admin_districts_pre2025 : null;

  if (!hasCentroid && !districts) return null;

  return (
    <Section bg="bg-foam" className="!py-12 sm:!py-16">
      <AreaLocationDebug
        areaName={area.name}
        hasCentroid={hasCentroid}
        lat={area.centroid_lat}
        lng={area.centroid_lon}
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ocean">Location</p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
            On the map
          </h2>
        </div>
        {districts && <p className="text-sm text-muted">{districts}</p>}
      </div>

      {hasCentroid && (
        <div className="relative z-0 isolate mt-6 aspect-[21/9] min-h-[220px] w-full overflow-hidden rounded-2xl bg-sand">
          <AreaMapClient
            lat={area.centroid_lat!}
            lng={area.centroid_lon!}
            title={area.name}
            className="h-full w-full"
          />
        </div>
      )}

      {area.centroid_note && (
        <p className="mt-3 text-xs text-muted">{area.centroid_note}</p>
      )}
    </Section>
  );
}
