import Image from "next/image";
import Link from "next/link";
import type { GuideArticle, GuideBlock } from "@/app/lib/living-guide";
import { CtaButton } from "@/app/components/CtaButton";
import { Section } from "@/app/components/sections";

function PriceTable({
  title,
  rows,
  footnote,
}: {
  title: string;
  rows: { item: string; price: string; note?: string }[];
  footnote?: string;
}) {
  return (
    <div className="mt-10">
      <h2 className="font-display text-xl font-semibold text-charcoal sm:text-2xl">{title}</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand/60 text-muted">
            <tr>
              <th className="px-4 py-3 font-medium sm:px-5">Item</th>
              <th className="px-4 py-3 font-medium sm:px-5">Typical price</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell sm:px-5">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {rows.map((row) => (
              <tr key={row.item}>
                <td className="px-4 py-3 text-charcoal sm:px-5">
                  {row.item}
                  {row.note && (
                    <p className="mt-0.5 text-xs text-muted sm:hidden">{row.note}</p>
                  )}
                </td>
                <td className="px-4 py-3 font-medium tabular-nums text-charcoal sm:px-5">
                  {row.price}
                </td>
                <td className="hidden px-4 py-3 text-muted sm:table-cell sm:px-5">
                  {row.note ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footnote && <p className="mt-3 text-sm text-muted">{footnote}</p>}
    </div>
  );
}

function Block({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case "intro":
      return <p className="text-lg leading-relaxed text-muted">{block.text}</p>;
    case "paragraph":
      return (
        <div className="mt-10">
          {block.title && (
            <h2 className="font-display text-xl font-semibold text-charcoal sm:text-2xl">
              {block.title}
            </h2>
          )}
          <p className={`text-base leading-relaxed text-muted ${block.title ? "mt-3" : ""}`}>
            {block.text}
          </p>
          {block.href && (
            <p className="mt-3">
              <Link
                href={block.href}
                {...(block.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="text-sm font-semibold text-ocean transition hover:text-ocean-deep"
              >
                {block.linkLabel ?? "Learn more"} →
              </Link>
            </p>
          )}
        </div>
      );
    case "figure":
      return (
        <figure className="mt-10 overflow-hidden rounded-2xl bg-sand">
          <div className="relative aspect-[16/10] w-full">
            <Image
              src={block.src}
              alt={block.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 48rem"
            />
          </div>
          {block.caption && (
            <figcaption className="border-t border-line bg-white px-4 py-3 text-sm text-muted">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    case "tour":
      return (
        <article className="mt-10 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_8px_30px_rgba(42,42,40,0.04)]">
          <div className="relative aspect-[16/10] w-full bg-sand">
            <Image
              src={block.image.src}
              alt={block.image.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 48rem"
            />
          </div>
          <div className="p-5 sm:p-7">
            <p className="text-sm font-medium text-ocean">Example day</p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-charcoal">
              {block.title}
            </h2>
            <p className="mt-2 text-base leading-relaxed text-muted">{block.tagline}</p>
            <p className="mt-4 text-sm text-charcoal">
              <span className="font-medium">{block.duration}</span>
              <span className="text-muted"> · </span>
              <span className="font-medium">{block.cost}</span>
            </p>
            <ol className="mt-5 space-y-3">
              {block.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-display text-xs font-semibold text-white"
                    style={{ backgroundColor: "#2f6f7e" }}
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            {block.tip && (
              <p className="mt-5 rounded-xl bg-sand/50 px-4 py-3 text-sm leading-relaxed text-muted">
                <span className="font-medium text-charcoal">Tip. </span>
                {block.tip}
              </p>
            )}
            {block.href && (
              <p className="mt-5">
                <Link
                  href={block.href}
                  className="text-sm font-semibold text-ocean transition hover:text-ocean-deep"
                >
                  {block.linkLabel ?? "Learn more"} →
                </Link>
              </p>
            )}
          </div>
        </article>
      );
    case "links":
      return (
        <div className="mt-10">
          <h2 className="font-display text-xl font-semibold text-charcoal sm:text-2xl">
            {block.title}
          </h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {block.items.map((item) => (
              <li key={item.href + item.label}>
                <Link
                  href={item.href}
                  {...(item.external !== false
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="group flex items-start justify-between gap-4 py-4 transition"
                >
                  <div>
                    <p className="font-medium text-charcoal transition group-hover:text-ocean">
                      {item.label}
                    </p>
                    {item.note && <p className="mt-1 text-sm text-muted">{item.note}</p>}
                  </div>
                  <span
                    aria-hidden
                    className="mt-0.5 shrink-0 text-muted transition group-hover:text-ocean"
                  >
                    ↗
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      );
    case "list":
      return (
        <div className="mt-10">
          <h2 className="font-display text-xl font-semibold text-charcoal sm:text-2xl">
            {block.title}
          </h2>
          <ul className="mt-4 space-y-2.5">
            {block.items.map((item) => (
              <li key={item} className="flex gap-3 text-base leading-relaxed text-muted">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ocean" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "tips":
      return (
        <div className="mt-10 rounded-2xl border border-line bg-sand/40 px-5 py-6 sm:px-7 sm:py-7">
          <h2 className="font-display text-lg font-semibold text-charcoal">{block.title}</h2>
          <ul className="mt-4 space-y-2.5">
            {block.items.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted">
                <span className="text-ocean" aria-hidden>
                  →
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "prices":
      return <PriceTable title={block.title} rows={block.rows} footnote={block.footnote} />;
    default:
      return null;
  }
}

export function GuideArticleContent({
  article,
  related,
  platformAreas,
}: {
  article: GuideArticle;
  related: GuideArticle[];
  platformAreas?: { id: string; name: string; vibe?: string | null; href?: string }[];
}) {
  return (
    <>
      <Section bg="bg-foam" className="!pt-8 sm:!pt-10">
        <Link
          href="/moving-guide"
          className="text-sm font-medium text-muted transition hover:text-ocean"
        >
          ← Living in Da Nang
        </Link>

        <div className="mx-auto mt-8 max-w-3xl">
          <p className="text-sm font-medium text-ocean">{article.hubLabel}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-charcoal sm:text-5xl text-balance">
            {article.title}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">{article.summary}</p>

          <div className="mt-10 border-t border-line pt-2">
            {article.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </div>

          {platformAreas && platformAreas.length > 0 && (
            <div className="mt-14">
              <h2 className="font-display text-xl font-semibold text-charcoal sm:text-2xl">
                All neighbourhoods on the site
              </h2>
              <p className="mt-2 text-sm text-muted">
                Full guides with rent snapshots, maps, and what’s nearby.
              </p>
              <ul className="mt-6 divide-y divide-line border-y border-line">
                {platformAreas.map((area) => (
                  <li key={area.id}>
                    <Link
                      href={area.href ?? `/areas/${area.id}`}
                      className="group flex items-center justify-between gap-4 py-4 transition"
                    >
                      <div>
                        <p className="font-display text-base font-semibold text-charcoal transition group-hover:text-ocean">
                          {area.name}
                        </p>
                        {area.vibe?.trim() && (
                          <p className="mt-0.5 text-sm text-muted">{area.vibe.trim()}</p>
                        )}
                      </div>
                      <span aria-hidden className="text-muted transition group-hover:text-ocean">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-4">
                <Link
                  href="/areas"
                  className="text-sm font-semibold text-ocean transition hover:text-ocean-deep"
                >
                  Browse all neighbourhood guides →
                </Link>
              </p>
            </div>
          )}

          <div className="mt-14 rounded-2xl border border-line bg-white px-6 py-8 text-center sm:px-8">
            <p className="font-display text-xl font-semibold text-charcoal">
              Looking for a place to stay?
            </p>
            <p className="mt-2 text-muted">
              We’ll match you with verified apartments around how you actually want to live.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <CtaButton href="/contact" variant="primary">
                Get matched
              </CtaButton>
              <CtaButton href="/apartments" variant="secondary">
                Browse apartments
              </CtaButton>
              <CtaButton href="/areas" variant="secondary">
                Browse neighbourhoods
              </CtaButton>
            </div>
          </div>
        </div>
      </Section>

      {related.length > 0 && (
        <Section bg="bg-white" className="!py-12 sm:!py-16">
          <p className="text-sm font-medium text-ocean">More from the guide</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-charcoal">Keep reading</h2>
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {related.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/moving-guide/${item.slug}`}
                  className="group flex items-center justify-between gap-4 py-5 transition"
                >
                  <div>
                    <p className="font-display text-lg font-semibold text-charcoal transition group-hover:text-ocean">
                      {item.hubLabel}
                    </p>
                    <p className="mt-1 text-sm text-muted">{item.summary}</p>
                  </div>
                  <span aria-hidden className="text-muted transition group-hover:text-ocean">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
