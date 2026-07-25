import Link from "next/link";
import type { Activity, CoworkingSpace } from "types";

function formatUsd(n: number): string {
  return `$${Math.round(n)}`;
}

function categoryLabel(category: string): string {
  return category
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function CoworkingCard({ spot }: { spot: CoworkingSpace }) {
  const priceBits = [
    spot.day_pass_usd != null ? `Day ~${formatUsd(spot.day_pass_usd)}` : null,
    spot.monthly_usd != null ? `Monthly ~${formatUsd(spot.monthly_usd)}` : null,
  ].filter(Boolean);

  return (
    <article className="rounded-2xl border border-line bg-white p-6 shadow-[0_6px_24px_rgba(42,42,40,0.03)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-semibold text-charcoal">{spot.name}</h2>
        {spot.neighbourhood_label && (
          <p className="text-sm text-muted">{spot.neighbourhood_label}</p>
        )}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{spot.description}</p>
      {(priceBits.length > 0 || spot.price_note) && (
        <p className="mt-4 text-sm font-medium text-charcoal">
          {priceBits.join(" · ")}
          {spot.price_note && (
            <span className="font-normal text-muted">
              {priceBits.length ? " — " : ""}
              {spot.price_note}
            </span>
          )}
        </p>
      )}
      {spot.wifi_note && <p className="mt-2 text-sm text-muted">Wifi: {spot.wifi_note}</p>}
      {spot.best_for && <p className="mt-2 text-sm text-muted">Best for: {spot.best_for}</p>}
      {spot.tags.length > 0 && (
        <p className="mt-3 text-xs text-muted">{spot.tags.join(" · ")}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        {spot.area_id && (
          <Link href={`/areas/${spot.area_id}`} className="font-medium text-ocean hover:text-ocean-deep">
            Area guide →
          </Link>
        )}
        {spot.website_url && (
          <a
            href={spot.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ocean hover:text-ocean-deep"
          >
            Website ↗
          </a>
        )}
        {spot.maps_url && (
          <a
            href={spot.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-muted hover:text-charcoal"
          >
            Map ↗
          </a>
        )}
      </div>
    </article>
  );
}

export function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <article className="rounded-2xl border border-line bg-white p-6 shadow-[0_6px_24px_rgba(42,42,40,0.03)]">
      <p className="text-xs font-medium uppercase tracking-wider text-ocean">
        {categoryLabel(activity.category)}
      </p>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-semibold text-charcoal">{activity.name}</h2>
        {activity.neighbourhood_label && (
          <p className="text-sm text-muted">{activity.neighbourhood_label}</p>
        )}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{activity.description}</p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-charcoal">
        {activity.typical_price_usd != null && (
          <span className="font-medium">~{formatUsd(activity.typical_price_usd)}</span>
        )}
        {activity.price_note && <span className="text-muted">{activity.price_note}</span>}
        {activity.duration_note && <span className="text-muted">{activity.duration_note}</span>}
      </div>
      {activity.tags.length > 0 && (
        <p className="mt-3 text-xs text-muted">{activity.tags.join(" · ")}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        {activity.area_id && (
          <Link
            href={`/areas/${activity.area_id}`}
            className="font-medium text-ocean hover:text-ocean-deep"
          >
            Area guide →
          </Link>
        )}
        {(activity.booking_url || activity.website_url) && (
          <a
            href={(activity.booking_url || activity.website_url)!}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ocean hover:text-ocean-deep"
          >
            {activity.booking_url ? "Book / info ↗" : "Website ↗"}
          </a>
        )}
        {activity.maps_url && (
          <a
            href={activity.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-muted hover:text-charcoal"
          >
            Map ↗
          </a>
        )}
      </div>
    </article>
  );
}
