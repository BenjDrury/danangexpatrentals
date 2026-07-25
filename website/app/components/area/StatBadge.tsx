"use client";

type StatBadgeProps = {
  label: string;
  value: string | number;
  /** Optional subdued style for secondary stats */
  subdued?: boolean;
};

export function StatBadge({ label, value, subdued }: StatBadgeProps) {
  return (
    <div
      className={
        subdued
          ? "rounded-quieter border border-line bg-foam/80 px-4 py-2.5 text-center"
          : "rounded-quieter border border-ocean/30 bg-palm-soft/80 px-4 py-2.5 text-center"
      }
    >
      <div className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </div>
      <div
        className={
          subdued ? "mt-0.5 font-semibold text-charcoal" : "mt-0.5 font-semibold text-ocean-deep"
        }
      >
        {value}
      </div>
    </div>
  );
}
