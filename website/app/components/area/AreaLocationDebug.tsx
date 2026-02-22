"use client";

import { useEffect } from "react";

const LOG = "[AreaLocation]";

type AreaLocationDebugProps = {
  areaName: string;
  hasCentroid: boolean;
  lat: number | null | undefined;
  lng: number | null | undefined;
};

/** Logs in the browser why the map may or may not render. Remove or guard with dev check once done. */
export function AreaLocationDebug({
  areaName,
  hasCentroid,
  lat,
  lng,
}: AreaLocationDebugProps) {
  useEffect(() => {
    console.log(LOG, "section rendered", {
      areaName,
      hasCentroid,
      lat,
      lng,
      message: hasCentroid
        ? "Map should mount; look for [AreaMap] logs next."
        : "No centroid data: map is not rendered. Add centroid_lat & centroid_lon for this area to show the map.",
    });
  }, [areaName, hasCentroid, lat, lng]);
  return null;
}
