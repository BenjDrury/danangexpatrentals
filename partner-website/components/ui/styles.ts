/** Shared control styles for Partner Studio — keep forms denser and consistent. */
export const inputClass =
  "mt-1 block w-full rounded-md border border-line bg-foam/70 px-3 py-2 text-sm text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20";

export const inputClassCompact =
  "mt-1 block w-full rounded-md border border-line bg-foam/70 px-2.5 py-1.5 text-sm text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20";

export const selectClass = inputClass;

export const labelClass = "block text-sm font-medium text-charcoal";

export const hintClass = "mt-0.5 text-xs text-muted";

export const btnBase =
  "inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-semibold transition disabled:opacity-50";

export const btnSizes = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3.5 py-2",
  lg: "px-5 py-2.5",
} as const;

export const btnVariants = {
  primary: "bg-ocean text-white hover:bg-ocean-deep",
  secondary:
    "border border-line bg-white text-charcoal hover:border-ocean/40 hover:text-ocean",
  ghost: "text-muted hover:bg-white/60 hover:text-ocean",
  danger:
    "border border-coral/35 bg-coral-soft/50 text-coral-deep hover:border-coral hover:bg-coral-soft",
  dangerSolid: "bg-coral text-white hover:bg-coral-deep",
  admin:
    "border border-admin/35 bg-admin-soft/60 text-admin-deep hover:border-admin/50",
} as const;
