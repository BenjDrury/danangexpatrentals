"use client";

import dynamic from "next/dynamic";

const AreaMap = dynamic(() => import("./AreaMap").then((m) => ({ default: m.AreaMap })), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[280px] w-full items-center justify-center rounded-quieter bg-sand text-muted">
      Loading map…
    </div>
  ),
});

type AreaMapClientProps = {
  lat: number;
  lng: number;
  title: string;
  className?: string;
};

export function AreaMapClient({ lat, lng, title, className = "" }: AreaMapClientProps) {
  return <AreaMap lat={lat} lng={lng} title={title} className={className} />;
}
