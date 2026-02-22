"use client";

import { formatUsd, formatVnd } from "@/lib/area-utils";

type RangeBarProps = {
  label: string;
  min: number;
  max: number;
  currency: "usd" | "vnd";
  /** Optional global max across all bars for relative width. */
  scaleMax?: number;
};

export function RangeBar({ label, min, max, currency, scaleMax }: RangeBarProps) {
  const format = currency === "usd" ? formatUsd : formatVnd;
  const displayMin = Math.min(min, max);
  const displayMax = Math.max(min, max);
  const range = displayMax - displayMin;
  const total = scaleMax != null && scaleMax > displayMax ? scaleMax : displayMax;
  const pctMin = total > 0 ? (displayMin / total) * 100 : 0;
  const pctWidth = total > 0 ? (range / total) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-600">
          {format(displayMin)} – {format(displayMax)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600"
          style={{ marginLeft: `${pctMin}%`, width: `${Math.max(pctWidth, 8)}%` }}
        />
      </div>
    </div>
  );
}
