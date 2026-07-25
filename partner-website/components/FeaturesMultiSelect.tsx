"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  LISTING_FEATURE_OPTIONS,
  filterListingFeatures,
} from "@/lib/listing-features";

type Props = {
  name?: string;
  label: string;
  hint?: string;
  initialSelected?: string[];
  placeholder: string;
  searchPlaceholder: string;
  selectedCountLabel: (count: number) => string;
  className?: string;
};

export function FeaturesMultiSelect({
  name = "features",
  label,
  hint,
  initialSelected = [],
  placeholder,
  searchPlaceholder,
  selectedCountLabel,
  className,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(() =>
    filterListingFeatures(initialSelected)
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...LISTING_FEATURE_OPTIONS];
    return LISTING_FEATURE_OPTIONS.filter((opt) => opt.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle(opt: string) {
    setSelected((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : filterListingFeatures([...prev, opt])
    );
  }

  function remove(opt: string) {
    setSelected((prev) => prev.filter((x) => x !== opt));
  }

  return (
    <div ref={rootRef} className={className}>
      <label htmlFor={listId} className="block text-sm font-medium text-charcoal">
        {label}
      </label>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}

      <input type="hidden" name={name} value={selected.join(", ")} />

      {selected.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => remove(opt)}
                className="inline-flex items-center gap-1 rounded-md border border-ocean/20 bg-ocean/5 px-2 py-1 text-xs font-medium text-ocean transition hover:border-ocean/40 hover:bg-ocean/10"
              >
                {opt}
                <span aria-hidden className="text-ocean/70">
                  ×
                </span>
                <span className="sr-only">Remove {opt}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative mt-2">
        <button
          type="button"
          id={listId}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 rounded-quieter border border-line bg-white px-3 py-2.5 text-left text-sm text-charcoal outline-none transition hover:border-ocean/35 focus:border-ocean/50 focus:ring-2 focus:ring-ocean/15"
        >
          <span className={selected.length ? "text-charcoal" : "text-muted"}>
            {selected.length ? selectedCountLabel(selected.length) : placeholder}
          </span>
          <span className="text-muted" aria-hidden>
            {open ? "▴" : "▾"}
          </span>
        </button>

        {open ? (
          <div
            role="listbox"
            aria-multiselectable="true"
            className="absolute z-20 mt-1.5 max-h-64 w-full overflow-hidden rounded-soft border border-line bg-white shadow-[0_16px_40px_rgba(42,42,40,0.12)]"
          >
            <div className="border-b border-line/80 p-2">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-line bg-foam/60 px-2.5 py-1.5 text-sm text-charcoal outline-none placeholder:text-muted/80 focus:border-ocean/40"
                autoFocus
              />
            </div>
            <ul className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted">—</li>
              ) : (
                filtered.map((opt) => {
                  const checked = selected.includes(opt);
                  return (
                    <li key={opt}>
                      <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-charcoal transition hover:bg-sand/80">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(opt)}
                          className="size-4 rounded border-line text-ocean focus:ring-ocean/30"
                        />
                        {opt}
                      </label>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
