"use client";

export type TabItem<T extends string> = {
  id: T;
  label: string;
  badge?: string | number | null;
};

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex gap-0.5 overflow-x-auto border-b border-line/80"
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            id={`tab-${item.id}`}
            onClick={() => onChange(item.id)}
            className={`relative shrink-0 px-3 py-2 text-sm font-medium transition ${
              active
                ? "text-ocean"
                : "text-muted hover:text-charcoal"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              {item.label}
              {item.badge != null && item.badge !== "" ? (
                <span
                  className={`rounded px-1.5 py-0.5 text-[0.65rem] font-semibold ${
                    active
                      ? "bg-ocean/10 text-ocean"
                      : "bg-sand text-muted"
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </span>
            {active ? (
              <span
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ocean"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
