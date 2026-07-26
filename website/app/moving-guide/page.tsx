import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getGuideArticlesForHub } from "../lib/living-guide";
import { CtaButton } from "../components/CtaButton";
import { Section, SectionHero } from "../components/sections";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Living in Da Nang — Guide",
  description:
    "A practical guide for expats and remote workers living in Da Nang: daily life tours, cost of living, neighbourhoods, visas, coworking, and activities.",
  path: "/moving-guide",
});

const REGISTRIES = [
  {
    href: "/moving-guide/coworking",
    title: "Coworking registry",
    summary: "Café circuits, day passes, and quieter monthly desks — updated from our database.",
  },
  {
    href: "/moving-guide/activities",
    title: "Activity registry",
    summary: "Surf, wellness, food, day trips, and outdoor loops with ballpark prices.",
  },
] as const;

export default function MovingGuidePage() {
  const articles = getGuideArticlesForHub();
  const dailyLife = articles[0]?.slug === "daily-life" ? articles[0] : null;
  const rest = dailyLife ? articles.slice(1) : articles;

  return (
    <div className="min-h-screen bg-foam">
      <SectionHero
        variant="page"
        title="Living in Da Nang"
        subtitle="Practical notes for international residents — useful whether you’re staying a few months or making it home."
      />

      <Section bg="bg-foam">
        <div className="mx-auto max-w-3xl">
          {dailyLife && (
            <Link
              href={`/moving-guide/${dailyLife.slug}`}
              className="group mb-12 block overflow-hidden rounded-2xl border border-line bg-white shadow-[0_10px_40px_rgba(42,42,40,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(42,42,40,0.08)]"
            >
              <div className="relative aspect-[16/9] bg-sand">
                <Image
                  src="/danang-my-khe.jpg"
                  alt="Daily life on Da Nang’s coastline"
                  fill
                  className="object-cover transition duration-700 ease-soft group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 48rem"
                  priority
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/70 to-transparent p-5 pt-16 sm:p-7 sm:pt-20">
                  <p className="text-sm font-medium text-white/90">Start here</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl">
                    {dailyLife.hubLabel}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
                    {dailyLife.summary}
                  </p>
                </div>
              </div>
            </Link>
          )}

          <p className="text-sm font-medium text-ocean">More topics</p>
          <p className="mt-2 text-lg leading-relaxed text-muted">
            Costs, neighbourhoods, visas, remote work — plus live registries for coworking and
            activities.
          </p>

          <ul className="mt-8 divide-y divide-line border-y border-line">
            {rest.map((article) => (
              <li key={article.slug}>
                <Link
                  href={`/moving-guide/${article.slug}`}
                  className="group flex items-center justify-between gap-4 py-8 transition"
                >
                  <div>
                    <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal transition group-hover:text-ocean">
                      {article.hubLabel}
                    </h2>
                    <p className="mt-2 text-base leading-relaxed text-muted">{article.summary}</p>
                  </div>
                  <span
                    aria-hidden
                    className="shrink-0 text-lg text-muted transition group-hover:text-ocean"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-14 text-sm font-medium text-ocean">Live registries</p>
          <p className="mt-2 text-base leading-relaxed text-muted">
            Database-backed lists we can keep expanding — not just static guide copy.
          </p>
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {REGISTRIES.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex items-center justify-between gap-4 py-6 transition"
                >
                  <div>
                    <h2 className="font-display text-xl font-semibold tracking-tight text-charcoal transition group-hover:text-ocean">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{item.summary}</p>
                  </div>
                  <span aria-hidden className="text-muted transition group-hover:text-ocean">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-14 text-center">
            <p className="text-lg text-muted">
              Looking for a place to stay? We’ll help you find a verified home.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <CtaButton href="/contact" variant="primary">
                Get matched
              </CtaButton>
              <CtaButton href="/apartments" variant="secondary">
                Browse apartments
              </CtaButton>
              <CtaButton href="/areas" variant="secondary">
                Neighbourhoods
              </CtaButton>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
