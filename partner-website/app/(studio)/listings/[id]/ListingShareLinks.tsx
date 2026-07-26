"use client";

import { CopyButton } from "@/components/CopyButton";
import { Section } from "@/components/ui";
import { getListingRelevantGuides } from "@/lib/guides";
import { guidePublicUrl } from "@/lib/public-url";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { capture } from "@/lib/analytics";

export type ShareLinkItem = {
  id: string;
  label: string;
  hint?: string;
  url: string;
  accent?: "live" | "area" | "guide";
};

type Props = {
  publicUrl: string;
  areaPublicUrl: string | null;
  areaName: string | null;
  isLive: boolean;
};

function LinkRow({
  item,
  copyLabel,
  copiedLabel,
}: {
  item: ShareLinkItem;
  copyLabel: string;
  copiedLabel: string;
}) {
  const accent =
    item.accent === "live"
      ? "border-palm/25 bg-palm-soft/30"
      : item.accent === "area"
        ? "border-ocean/20 bg-ocean/[0.04]"
        : "border-line/70 bg-white/60";

  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 ${accent}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-charcoal">{item.label}</p>
        {item.hint ? <p className="text-xs text-muted">{item.hint}</p> : null}
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            capture("share_link_opened", {
              link_type: item.id,
              accent: item.accent ?? null,
            })
          }
          className="mt-0.5 block truncate text-xs font-medium text-ocean underline-offset-2 hover:underline"
        >
          {item.url}
        </a>
      </div>
      <CopyButton
        text={item.url}
        label={copyLabel}
        copiedLabel={copiedLabel}
        event="share_link_copied"
        eventProps={{ link_type: item.id, accent: item.accent ?? null }}
        className="shrink-0 rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-charcoal transition hover:border-ocean/40 hover:text-ocean"
      />
    </li>
  );
}

export function ListingShareLinks({
  publicUrl,
  areaPublicUrl,
  areaName,
  isLive,
}: Props) {
  const { t, locale } = useLocale();
  const guides = getListingRelevantGuides();

  const items: ShareLinkItem[] = [
    {
      id: "listing",
      label: t("listings.publicListingLink"),
      hint: isLive ? t("workspace.share.liveHint") : t("workspace.share.previewHint"),
      url: publicUrl,
      accent: isLive ? "live" : undefined,
    },
  ];

  if (areaPublicUrl) {
    items.push({
      id: "area",
      label: areaName
        ? t("workspace.share.areaNamed", { name: areaName })
        : t("listings.publicAreaLink"),
      hint: t("workspace.share.areaHint"),
      url: areaPublicUrl,
      accent: "area",
    });
  }

  for (const guide of guides) {
    items.push({
      id: guide.path,
      label: locale === "vi" ? guide.titleVi : guide.title,
      hint: locale === "vi" ? guide.descriptionVi : guide.description,
      url: guidePublicUrl(guide.path),
      accent: "guide",
    });
  }

  return (
    <Section
      title={t("workspace.share.title")}
      description={t("workspace.share.subtitle")}
    >
      <ul className="space-y-1.5">
        {items.map((item) => (
          <LinkRow
            key={item.id}
            item={item}
            copyLabel={t("copy.default")}
            copiedLabel={t("copy.copied")}
          />
        ))}
      </ul>
    </Section>
  );
}
