"use client";

import { useEffect, useRef } from "react";
import { capture } from "@/lib/analytics";

type Props = {
  apartmentId: string;
  areaId?: string;
};

export function TrackListingView({ apartmentId, areaId }: Props) {
  const sent = useRef(false);

  useEffect(() => {
    if (!apartmentId || sent.current) return;
    sent.current = true;

    capture("listing_viewed", {
      apartment_id: apartmentId,
      area_id: areaId ?? null,
    });

    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apartmentId }),
      keepalive: true,
    }).catch(() => {
      /* ignore — analytics must not affect UX */
    });
  }, [apartmentId, areaId]);

  return null;
}
