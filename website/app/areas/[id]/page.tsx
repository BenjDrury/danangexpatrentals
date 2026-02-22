import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SECTION_CLASS } from "../../lib/constants";
import { getAreaById, getApartments } from "@/lib/data";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const area = await getAreaById(id);
  if (!area) return { title: "Area not found" };
  return {
    title: `${area.name} — Best area to live in Da Nang for Expats`,
    description: `${area.vibe} ${area.price_range} Who it's for: ${area.who}`,
  };
}

export default async function AreaPage({ params }: Props) {
  const { id } = await params;
  const [area, apartmentsInArea] = await Promise.all([
    getAreaById(id),
    getApartments({ area_id: id }),
  ]);

  if (!area) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <section className={`${SECTION_CLASS} bg-white`}>
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-12">
          <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl md:max-w-lg md:aspect-[3/2]">
            <Image
              src={area.image}
              alt={area.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 512px"
              priority
            />
          </div>
          <div>
            <Link
              href="/areas"
              className="text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              ← All areas
            </Link>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              {area.name}
            </h1>
            <p className="mt-6 text-lg text-slate-700">
              <strong>Vibe:</strong> {area.vibe}
            </p>
            <p className="mt-2 text-slate-700">
              <strong>Typical price range:</strong> {area.price_range}
            </p>
            <p className="mt-2 text-slate-700">
              <strong>Who it&apos;s good for:</strong> {area.who}
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-flex rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-600"
            >
              Find apartments in {area.name}
            </Link>
          </div>
        </div>
      </section>

      {apartmentsInArea.length > 0 && (
        <section className={`${SECTION_CLASS} bg-slate-50`}>
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Apartments in {area.name}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {apartmentsInArea.map((apt) => (
              <Link
                key={apt.id}
                href={`/apartments/${apt.id}`}
                className="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={apt.main_image}
                    alt={apt.title}
                    fill
                    className="object-cover transition group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-slate-900 group-hover:text-teal-600">
                    {apt.title}
                  </h3>
                  <p className="mt-1 text-lg font-medium text-teal-600">
                    {apt.price_display}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {apt.bedrooms} BR
                    {apt.bathrooms != null ? ` · ${apt.bathrooms} bath` : ""}
                    {apt.size_sqm != null ? ` · ${apt.size_sqm} m²` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className={`${SECTION_CLASS} bg-white`}>
        <p className="text-center">
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
