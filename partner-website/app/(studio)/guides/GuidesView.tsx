"use client";

import { PARTNER_GUIDE_LINKS } from "@/lib/guides";
import { guidePublicUrl } from "@/lib/public-url";
import { CopyButton } from "@/components/CopyButton";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function GuidesView() {
  const { locale, t } = useLocale();

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h1 className="font-display text-3xl font-semibold text-charcoal">{t("guides.title")}</h1>
        <p className="mt-2 max-w-xl text-muted">{t("guides.subtitle")}</p>
      </div>

      <ul className="space-y-3">
        {PARTNER_GUIDE_LINKS.map((guide, i) => {
          const url = guidePublicUrl(guide.path);
          const title = locale === "vi" ? guide.titleVi : guide.title;
          const description = locale === "vi" ? guide.descriptionVi : guide.description;
          return (
            <li
              key={guide.path}
              className="flex flex-col gap-3 rounded-soft border border-line/70 bg-white/70 px-4 py-4 transition hover:border-ocean/25 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold text-charcoal">{title}</p>
                <p className="mt-0.5 text-sm text-muted">{description}</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block truncate text-xs font-medium text-ocean hover:underline"
                >
                  {url}
                </a>
              </div>
              <CopyButton
                text={url}
                label={t("guides.copyLink")}
                copiedLabel={t("guides.copied")}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
