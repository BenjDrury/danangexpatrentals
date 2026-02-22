import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SECTION_CLASS } from "../lib/constants";
import { getAreas } from "@/lib/data";

export const metadata: Metadata = {
  title: "Best Areas to Live in Da Nang for Expats — An Thuong, My Khe, My An",
  description:
    "Where to live in Da Nang as an expat: An Thuong, My Khe beach, My An, and quieter local areas. Vibe, price ranges, and who each area suits.",
};

export default async function AreasPage() {
  const areas = await getAreas();

  return (
    <div className="min-h-screen bg-slate-50">
      <section className={`${SECTION_CLASS} bg-white`}>
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Best areas to live in Da Nang as an expat
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            Quick guides to An Thuong, My Khe, My An, and quieter spots — vibe, prices, and who each area suits.
          </p>
        </div>
      </section>

      <section className={`${SECTION_CLASS} bg-slate-50`}>
        <div className="space-y-16">
          {areas.map((area) => (
            <article
              key={area.id}
              className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm"
            >
              <div className="grid md:grid-cols-2 gap-0">
                <Link href={`/areas/${area.id}`} className="relative block aspect-[4/3] md:aspect-auto md:min-h-[280px]">
                  <Image
                    src={area.image}
                    alt={area.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </Link>
                <div className="p-8 flex flex-col justify-center">
                  <Link
                    href={`/areas/${area.id}`}
                    className="text-2xl font-bold text-slate-900 hover:text-teal-600 transition"
                  >
                    {area.name}
                  </Link>
                  <p className="mt-4 text-slate-700"><strong>Vibe:</strong> {area.vibe}</p>
                  <p className="mt-2 text-slate-700"><strong>Typical price range:</strong> {area.price_range}</p>
                  <p className="mt-2 text-slate-700"><strong>Who it's good for:</strong> {area.who}</p>
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
          ))}
        </div>
        <p className="mt-12 text-center">
          <Link
            href="/contact"
            className="inline-flex rounded-xl bg-teal-500 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-teal-600"
          >
            Tell us your budget — we check availability
          </Link>
        </p>
      </section>
    </div>
  );
}
