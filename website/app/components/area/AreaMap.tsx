"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type AreaMapProps = {
  lat: number;
  lng: number;
  title: string;
  className?: string;
};

export function AreaMap({ lat, lng, title, className = "" }: AreaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    let map: import("leaflet").Map | null = null;

    void import("leaflet")
      .then((mod) => {
        if (cancelled || !containerRef.current) return;
        const L = mod.default;
        const target = containerRef.current;

        // Strict Mode / fast remount can leave Leaflet's id on the node
        // after cleanup ran before the async init finished.
        const leafletEl = target as HTMLDivElement & { _leaflet_id?: number };
        if (leafletEl._leaflet_id) {
          leafletEl._leaflet_id = undefined;
          leafletEl.innerHTML = "";
        }

        if (target.offsetHeight === 0) return;

        map = L.map(target, {
          scrollWheelZoom: false,
          attributionControl: true,
        }).setView([lat, lng], 12);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        L.circle([lat, lng], {
          radius: 1000,
          color: "#2f6f7e",
          fillColor: "#2f6f7e",
          fillOpacity: 0.12,
          weight: 2,
        }).addTo(map);

        const marker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: "area-map-marker",
            html: '<span style="background:#2f6f7e;width:16px;height:16px;border-radius:50%;display:block;margin-left:-8px;margin-top:-8px;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></span>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          }),
        }).addTo(map);
        marker.bindPopup(title);

        // Layout may still be settling (aspect ratio / sticky CTA)
        requestAnimationFrame(() => {
          if (!cancelled) map?.invalidateSize();
        });
      })
      .catch(() => {
        // Leaflet failed to load — leave empty container
      });

    return () => {
      cancelled = true;
      if (map) {
        map.remove();
        map = null;
      } else if (el) {
        const leafletEl = el as HTMLDivElement & { _leaflet_id?: number };
        leafletEl._leaflet_id = undefined;
        el.innerHTML = "";
      }
    };
  }, [lat, lng, title]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height: "100%", minHeight: 220 }}
      aria-hidden
    />
  );
}
