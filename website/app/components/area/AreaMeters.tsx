import type { IntensityLevel } from "@/lib/area-display";
import { intensityLabel, intensitySteps } from "@/lib/area-display";

type Tone = "light" | "dark";

const TONE = {
  light: {
    label: "text-muted",
    value: "text-charcoal",
    track: "bg-sand",
    fill: "#2f6f7e",
    pipOn: "#2f6f7e",
    pipOff: "#e2d6c6",
    card: "rounded-2xl border border-line bg-foam p-5 shadow-[0_6px_24px_rgba(42,42,40,0.03)]",
  },
  dark: {
    label: "hero-copy-muted",
    value: "hero-copy",
    track: "bg-white/20",
    fill: "#ffffff",
    pipOn: "#ffffff",
    pipOff: "rgba(255,255,255,0.28)",
    card: "rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm",
  },
} as const;

type MeterCardProps = {
  label: string;
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
};

export function MeterCard({ label, tone = "light", children, className = "" }: MeterCardProps) {
  const t = TONE[tone];
  return (
    <div className={`${t.card} ${className}`.trim()}>
      <p className={`text-xs font-medium uppercase tracking-wider ${t.label}`}>{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

type ScoreMeterProps = {
  score: number; // 0–10
  display: string;
  tone?: Tone;
};

/** Horizontal bar for a 0–10 score. */
export function ScoreMeter({ score, display, tone = "light" }: ScoreMeterProps) {
  const t = TONE[tone];
  const pct = Math.min(100, Math.max(0, (score / 10) * 100));
  return (
    <div>
      <p className={`font-display text-xl font-semibold tabular-nums ${t.value}`}>{display}</p>
      <div className={`mt-2.5 h-1.5 w-full overflow-hidden rounded-full ${t.track}`}>
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-soft"
          style={{ width: `${pct}%`, backgroundColor: t.fill }}
        />
      </div>
    </div>
  );
}

type PercentMeterProps = {
  percent: number;
  tone?: Tone;
  suffix?: string;
};

export function PercentMeter({ percent, tone = "light", suffix = "furnished" }: PercentMeterProps) {
  const t = TONE[tone];
  const pct = Math.min(100, Math.max(0, percent));
  return (
    <div>
      <p className={`font-display text-xl font-semibold tabular-nums ${t.value}`}>
        ~{Math.round(pct)}%
        <span className={`ml-1.5 text-sm font-medium ${t.label}`}>{suffix}</span>
      </p>
      <div className={`mt-2.5 h-1.5 w-full overflow-hidden rounded-full ${t.track}`}>
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-soft"
          style={{ width: `${pct}%`, backgroundColor: t.fill }}
        />
      </div>
    </div>
  );
}

type LevelMeterProps = {
  level: IntensityLevel;
  tone?: Tone;
};

/** Three-step intensity indicator (low / medium / high). */
export function LevelMeter({ level, tone = "light" }: LevelMeterProps) {
  const t = TONE[tone];
  const filled = intensitySteps(level);
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex gap-1.5" aria-hidden>
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: step <= filled ? t.pipOn : t.pipOff }}
          />
        ))}
      </div>
      <p className={`font-display text-lg font-semibold ${t.value}`}>{intensityLabel(level)}</p>
    </div>
  );
}

type LeaseMeterProps = {
  months: number;
  tone?: Tone;
};

export function LeaseMeter({ months, tone = "light" }: LeaseMeterProps) {
  const t = TONE[tone];
  return (
    <div>
      <p className={`font-display text-xl font-semibold tabular-nums ${t.value}`}>
        {Math.round(months)}
        <span className={`ml-1.5 text-sm font-medium ${t.label}`}>mo typical</span>
      </p>
    </div>
  );
}

type TagChipProps = {
  children: React.ReactNode;
};

export function TagChip({ children }: TagChipProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium text-charcoal">
      {children}
    </span>
  );
}

type InsightCardProps = {
  title: string;
  level?: IntensityLevel | null;
  note?: string | null;
};

/** Card with optional level meter + supporting note. */
export function InsightCard({ title, level, note }: InsightCardProps) {
  const hasNote = note != null && note.trim() !== "" && !parseLooksLikeLevelOnly(note);
  return (
    <div className="rounded-2xl border border-line bg-foam p-5 shadow-[0_6px_24px_rgba(42,42,40,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-charcoal">{title}</h3>
      </div>
      {level && (
        <div className="mt-3">
          <LevelMeter level={level} tone="light" />
        </div>
      )}
      {hasNote && (
        <p className={`text-sm leading-relaxed text-muted ${level ? "mt-3" : "mt-2"}`}>{note}</p>
      )}
    </div>
  );
}

function parseLooksLikeLevelOnly(note: string): boolean {
  const v = note.trim().toLowerCase();
  return v === "low" || v === "medium" || v === "high" || v === "med" || v === "moderate";
}
