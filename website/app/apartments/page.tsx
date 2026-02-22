import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Section, SectionHero } from "../components/sections";
import { getAreas, getApartmentTypes } from "@/lib/data";
import { formatAliases, getAreaPriceTags, getWhoTags } from "@/lib/area-utils";

export const metadata: Metadata = {
  title: "Apartments in Da Nang for Expats — Studios, 1BR, Serviced",
  description:
    "Browse expat-friendly apartments in Da Nang: studios under $350, 1BR near My Khe beach, serviced apartments. An Thuong, My An, My Khe area guides.",
};

const CTA_TEXT = "Tell us your budget — we check availability manually.";

export default async function ApartmentsPage() {
  const [apartmentTypes, areas] = await Promise.all([getApartmentTypes(), getAreas()]);
  const areaGuides = areas.filter((a) => ["an-thuong", "my-khe", "my-an"].includes(a.id));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <SectionHero
        variant="page"
        title="Apartments in Da Nang suitable for expats"
        subtitle="We don't list everything — we match you with verified options in expat-friendly areas. Studios, 1BR, serviced apartments, and more."
      />

      <Section bg="bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">What we help you find</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {apartmentTypes.map((card) => (
            <div
              key={card.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-slate-600">{card.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center">
          <Link
            href="/contact"
            className="inline-flex rounded-xl bg-teal-500 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-teal-600"
          >
            {CTA_TEXT}
          </Link>
        </p>
      </Section>

      <Section bg="bg-white">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Area guides</h2>
        <p className="mt-4 text-slate-600">
          We work with agents across the most popular expat areas. Here’s a quick overview.
        </p>
        <div className="mt-12 space-y-16">
          {areaGuides.map((area) => (
            <article key={area.id} className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 shadow-sm">
              <div className="grid md:grid-cols-2 gap-0">
                <Link href={`/areas/${area.id}`} className="relative block aspect-[4/3] md:aspect-auto md:min-h-[240px]">
                  {area.images?.[0] ? (
                    <Image
                      src={area.images[0]}
                      alt={area.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-slate-200" aria-hidden />
                  )}
                </Link>
                <div className="p-8 flex flex-col justify-center">
                  <Link href={`/areas/${area.id}`} className="text-2xl font-bold text-slate-900 hover:text-teal-600 transition">
                    {area.name} apartments
                  </Link>
                  {formatAliases((area as { aliases?: string | string[] | null }).aliases) && (
                    <p className="mt-1 text-sm text-slate-500">
                      {formatAliases((area as { aliases?: string | string[] | null }).aliases)}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {area.vibe?.trim() && (
                      <span className="inline-flex rounded-full bg-teal-100 px-3.5 py-1.5 text-sm font-medium text-teal-900">
                        {area.vibe.trim()}
                      </span>
                    )}
                    {getAreaPriceTags(area).map((label) => (
                      <span key={label} className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-800">
                        {label}
                      </span>
                    ))}
                    {getWhoTags(area.who).map((label) => (
                      <span key={label} className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-800">
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/areas/${area.id}`}
                      className="inline-flex rounded-xl border border-teal-500 px-5 py-2.5 text-sm font-semibold text-teal-600 transition hover:bg-teal-50"
                    >
                      View {area.name} guide
                    </Link>
                    <Link
                      href="/contact"
                      className="inline-flex rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-600"
                    >
                      Check availability
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-12 text-center">
          <Link
            href="/contact"
            className="inline-flex rounded-xl bg-teal-500 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-teal-600"
          >
            {CTA_TEXT}
          </Link>
        </p>
      </Section>
    </div>
  );
}
