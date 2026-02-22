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
          ? "rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-center"
          : "rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-2.5 text-center"
      }
    >
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div
        className={
          subdued ? "mt-0.5 font-semibold text-slate-800" : "mt-0.5 font-semibold text-teal-800"
        }
      >
        {value}
      </div>
    </div>
  );
}
