import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CONTENT_CONTAINER, SECTION_PADDING } from "../../lib/constants";
import { getApartmentById, getAreaById } from "@/lib/data";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const apartment = await getApartmentById(id);
  if (!apartment) return { title: "Apartment not found" };
  const area = apartment ? await getAreaById(apartment.area_id) : null;
  const areaName = area?.name ?? "Da Nang";
  return {
    title: `${apartment.title} — ${areaName} | Da Nang Expat Rentals`,
    description:
      apartment.description ??
      `${apartment.title} in ${areaName}. ${apartment.price_display}. ${apartment.bedrooms} bedroom${apartment.bedrooms !== 1 ? "s" : ""}.`,
  };
}

export default async function ApartmentPage({ params }: Props) {
  const { id } = await params;
  const apartment = await getApartmentById(id);
  if (!apartment) notFound();

  const area = await getAreaById(apartment.area_id);
  const allImages = [apartment.main_image, ...apartment.images].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className={`w-full ${SECTION_PADDING} bg-white`}>
        <div className={CONTENT_CONTAINER}>
        <Link
          href={area ? `/areas/${area.id}` : "/apartments"}
          className="text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          ← {area ? `Back to ${area.name}` : "All apartments"}
        </Link>

        <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* Gallery */}
          <div className="flex-1 space-y-4">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100">
              <Image
                src={apartment.main_image}
                alt={apartment.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
            </div>
            {allImages.length > 1 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {allImages.slice(1, 7).map((url, i) => (
                  <div
                    key={i}
                    className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100"
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 20vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="w-full lg:max-w-md lg:shrink-0">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {apartment.title}
            </h1>
            {area && (
              <Link
                href={`/areas/${area.id}`}
                className="mt-2 inline-block text-teal-600 hover:text-teal-700 font-medium"
              >
                {area.name}
              </Link>
            )}
            <p className="mt-4 text-2xl font-semibold text-teal-600">
              {apartment.price_display}
            </p>

            <ul className="mt-6 space-y-2 text-slate-700">
              <li>
                <strong>Bedrooms:</strong> {apartment.bedrooms}
              </li>
              {apartment.bathrooms != null && (
                <li>
                  <strong>Bathrooms:</strong> {apartment.bathrooms}
                </li>
              )}
              {apartment.size_sqm != null && (
                <li>
                  <strong>Size:</strong> {apartment.size_sqm} m²
                </li>
              )}
              {apartment.available_from && (
                <li>
                  <strong>Available from:</strong>{" "}
                  {new Date(apartment.available_from).toLocaleDateString(
                    "en-GB",
                    { day: "numeric", month: "long", year: "numeric" }
                  )}
                </li>
              )}
              {apartment.min_lease_months != null && (
                <li>
                  <strong>Min. lease:</strong> {apartment.min_lease_months}{" "}
                  month{apartment.min_lease_months !== 1 ? "s" : ""}
                </li>
              )}
            </ul>

            {apartment.features.length > 0 && (
              <div className="mt-6">
                <strong className="text-slate-900">Features:</strong>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {apartment.features.map((f) => (
                    <li
                      key={f}
                      className="rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-700"
                    >
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {apartment.description && (
              <div className="mt-6">
                <strong className="text-slate-900">Description</strong>
                <p className="mt-2 text-slate-700 whitespace-pre-wrap">
                  {apartment.description}
                </p>
              </div>
            )}

            <Link
              href="/contact"
              className="mt-8 inline-flex w-full justify-center rounded-xl bg-teal-500 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-teal-600"
            >
              Inquire about this apartment
            </Link>
          </div>
        </div>
        </div>
      </section>
    </div>
  );
}
