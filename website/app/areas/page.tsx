import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Section, SectionHero } from "../components/sections";
import { getAreas } from "@/lib/data";
import { formatAliases, getAreaPriceTags, getWhoTags } from "@/lib/area-utils";

export const metadata: Metadata = {
  title: "Best Areas to Live in Da Nang for Expats — An Thuong, My Khe, My An",
  description:
    "Where to live in Da Nang as an expat: An Thuong, My Khe beach, My An, and quieter local areas. Vibe, price ranges, and who each area suits.",
};

export default async function AreasPage() {
  const areas = await getAreas();

  return (
    <div className="min-h-screen bg-slate-50">
      <SectionHero
        variant="page"
        title="Best areas to live in Da Nang as an expat"
        subtitle="Quick guides to An Thuong, My Khe, My An, and quieter spots — vibe, prices, and who each area suits."
      />

      <Section bg="bg-slate-50">
        <div className="space-y-16">
          {areas.map((area) => {
            const imageUrl = (area as { images?: string[] | null }).images?.[0];
            return (
            <article
              key={area.id}
              className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm"
            >
              <div className="grid md:grid-cols-2 gap-0">
                <Link href={`/areas/${area.id}`} className="relative block aspect-[4/3] md:aspect-auto md:min-h-[280px]">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
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
                  <Link
                    href={`/areas/${area.id}`}
                    className="text-2xl font-bold text-slate-900 hover:text-teal-600 transition"
                  >
                    {area.name}
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
                      Find apartments in {area.name}
                    </Link>
                  </div>
                </div>
              </div>
            </article>
            );
          })}
        </div>
        <p className="mt-12 text-center">
          <Link
            href="/contact"
            className="inline-flex rounded-xl bg-teal-500 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-teal-600"
          >
            Tell us your budget — we check availability
          </Link>
        </p>
      </Section>
    </div>
  );
}
