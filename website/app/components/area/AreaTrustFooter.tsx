import Link from "next/link";
import type { Area } from "types";
import { Section } from "@/app/components/sections";
import { isEmpty, parseSourcesUrls } from "@/lib/area-utils";

type AreaTrustFooterProps = { area: Area };

export function AreaTrustFooter({ area }: AreaTrustFooterProps) {
  const sources = parseSourcesUrls(area.sources_urls);
  const hasSnapshot = !isEmpty(area.snapshot_date);

  return (
    <Section bg="bg-white">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-slate-900">
          Verified listings & transparent pricing
        </h2>
        <p className="mt-3 text-slate-700">
          We only list apartments we’ve verified with local agents. Prices are
          shown in USD where possible, and we don’t add hidden fees. All our
          partners are English-friendly so you can avoid scams and
          miscommunication.
        </p>
        {hasSnapshot && (
          <p className="mt-4 text-sm text-slate-500">
            Last updated:{" "}
            {new Date(area.snapshot_date!).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
        {sources.length > 0 && (
          <details className="mt-6 group">
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700 hover:text-slate-900 [&::-webkit-details-marker]:hidden">
              Sources
            </summary>
            <p className="mt-2 text-xs text-slate-500">
              Rent and area data are based on the following:
            </p>
            <ul className="mt-2 space-y-1">
              {sources.map((url, i) => (
                <li key={i}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-teal-600 hover:underline"
                  >
                    {url.replace(/^https?:\/\//, "").slice(0, 50)}
                    {url.length > 50 ? "…" : ""}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}
        <div className="mt-8 flex flex-wrap gap-6 text-sm">
          <Link href="/areas" className="font-medium text-teal-600 hover:underline">
            See all areas
          </Link>
          <Link href="/how-it-works" className="font-medium text-teal-600 hover:underline">
            How it works
          </Link>
          <Link href="/avoid-scams" className="font-medium text-teal-600 hover:underline">
            Avoid scams
          </Link>
        </div>
      </div>
    </Section>
  );
}
