"use client";

import { PARTNER_GUIDE_LINKS } from "@/lib/guides";
import { guidePublicUrl } from "@/lib/public-url";
import { CopyButton } from "@/components/CopyButton";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { capture } from "@/lib/analytics";

export function GuidesView() {
  const { locale, t } = useLocale();

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">{t("guides.title")}</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">{t("guides.subtitle")}</p>
      </div>

      <ul className="space-y-2">
        {PARTNER_GUIDE_LINKS.map((guide, i) => {
          const url = guidePublicUrl(guide.path);
          const title = locale === "vi" ? guide.titleVi : guide.title;
          const description = locale === "vi" ? guide.descriptionVi : guide.description;
          return (
            <li
              key={guide.path}
              className="flex flex-col gap-2 rounded-lg border border-line/70 bg-white/70 px-3.5 py-3 transition hover:border-ocean/25 sm:flex-row sm:items-center sm:justify-between"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="min-w-0">
                <p className="font-display text-base font-semibold text-charcoal">{title}</p>
                <p className="mt-0.5 text-sm text-muted">{description}</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    capture("guide_link_opened", { path: guide.path })
                  }
                  className="mt-2 inline-block truncate text-xs font-medium text-ocean hover:underline"
                >
                  {url}
                </a>
              </div>
              <CopyButton
                text={url}
                label={t("guides.copyLink")}
                copiedLabel={t("guides.copied")}
                event="guide_link_copied"
                eventProps={{ path: guide.path }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
