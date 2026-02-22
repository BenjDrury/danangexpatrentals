"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

const LOG = "[AreaMap]";

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
    console.log(LOG, "effect run", { lat, lng, title, hasEl: !!el });
    if (!el) {
      console.warn(LOG, "no container ref, skipping");
      return;
    }
    let map: import("leaflet").Map | null = null;

    void import("leaflet")
      .then((L) => {
        console.log(LOG, "leaflet loaded");
        if (!containerRef.current) {
          console.warn(LOG, "container ref lost after leaflet load");
          return;
        }

        function init() {
          const target = containerRef.current;
          const width = target?.offsetWidth ?? 0;
          const height = target?.offsetHeight ?? 0;
          console.log(LOG, "init", { hasTarget: !!target, width, height, lat, lng });
          if (!target) {
            console.warn(LOG, "no target in init");
            return;
          }
          if (height === 0) {
            console.warn(LOG, "container has no height yet, skipping map init (Leaflet needs dimensions)");
            return;
          }
          try {
            map = L.default.map(target).setView([lat, lng], 12);
            L.default.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            }).addTo(map);
            L.default
              .circle([lat, lng], {
                radius: 1000,
                color: "#0d9488",
                fillColor: "#0d9488",
                fillOpacity: 0.12,
                weight: 2,
              })
              .addTo(map);
            const marker = L.default.marker([lat, lng], {
              icon: L.default.divIcon({
                className: "area-map-marker",
                html: '<span style="background:#0d9488;width:16px;height:16px;border-radius:50%;display:block;margin-left:-8px;margin-top:-8px;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></span>',
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              }),
            }).addTo(map);
            marker.bindPopup(title);
            map.invalidateSize();
            console.log(LOG, "map initialized");
          } catch (err) {
            console.error(LOG, "map init error", err);
          }
        }

        requestAnimationFrame(() => {
          requestAnimationFrame(init);
        });
      })
      .catch((err) => {
        console.error(LOG, "leaflet import failed", err);
      });

    return () => {
      console.log(LOG, "cleanup");
      map?.remove();
    };
  }, [lat, lng, title]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height: "100%", minHeight: 280 }}
      aria-hidden
    />
  );
}
