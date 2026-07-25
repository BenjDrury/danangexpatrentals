"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n/messages";

const OPTIONS: Locale[] = ["en", "vi"];

export function LangToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className={`inline-flex items-center rounded-quieter border border-line/80 bg-white/70 p-0.5 text-xs font-semibold ${className}`}
      role="group"
      aria-label={t("lang.switch")}
    >
      {OPTIONS.map((opt) => {
        const active = locale === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => setLocale(opt)}
            className={`rounded-md px-2.5 py-1 transition ${
              active
                ? "bg-ocean text-white shadow-sm"
                : "text-muted hover:text-charcoal"
            }`}
            aria-pressed={active}
          >
            {t(opt === "en" ? "lang.en" : "lang.vi")}
          </button>
        );
      })}
    </div>
  );
}
