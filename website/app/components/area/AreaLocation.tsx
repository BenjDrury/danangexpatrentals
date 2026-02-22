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
  const hasAny =
    hasCentroid ||
    !isEmpty(area.admin_districts_pre2025) ||
    !isEmpty(area.wards_pre2025) ||
    !isEmpty(area.wards_post2025_2025reorg);

   if(!hasAny) return null;

  return (
    <Section bg="bg-slate-50">
      <AreaLocationDebug
        areaName={area.name}
        hasCentroid={hasCentroid}
        lat={area.centroid_lat}
        lng={area.centroid_lon}
      />
      <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        Where {area.name} is
      </h2>
      <p className="mt-2 text-slate-600">Location and how it&apos;s organized.</p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {hasCentroid && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="aspect-[4/3] min-h-[280px] w-full overflow-hidden rounded-xl">
              <AreaMapClient
                lat={area.centroid_lat!}
                lng={area.centroid_lon!}
                title={area.name}
                className="h-full w-full"
              />
            </div>
            {area.centroid_note && (
              <p className="mt-2 text-xs text-slate-500">{area.centroid_note}</p>
            )}
          </div>
        )}
        <div className="space-y-3">
          {!isEmpty(area.admin_districts_pre2025) && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Districts
              </span>
              <p className="mt-1 text-slate-700">{area.admin_districts_pre2025}</p>
            </div>
          )}
          {!isEmpty(area.wards_pre2025) && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Wards (pre-2025)
              </span>
              <p className="mt-1 text-slate-700">{area.wards_pre2025}</p>
            </div>
          )}
          {!isEmpty(area.wards_post2025_2025reorg) && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Wards (2025 reorg)
              </span>
              <p className="mt-1 text-slate-700">{area.wards_post2025_2025reorg}</p>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
