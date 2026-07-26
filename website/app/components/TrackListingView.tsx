"use client";

import { useEffect, useRef } from "react";

type Props = {
  apartmentId: string;
};

export function TrackListingView({ apartmentId }: Props) {
  const sent = useRef(false);

  useEffect(() => {
    if (!apartmentId || sent.current) return;
    sent.current = true;

    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apartmentId }),
      keepalive: true,
    }).catch(() => {
      /* ignore — analytics must not affect UX */
    });
  }, [apartmentId]);

  return null;
}
