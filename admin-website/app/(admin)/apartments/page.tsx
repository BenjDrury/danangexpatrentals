import { getApartments, getAreas } from "@/lib/data";
import { ApartmentsList } from "./ApartmentsList";

export default async function AdminApartmentsPage() {
  const [apartments, areas] = await Promise.all([getApartments(), getAreas()]);

  const areaNames: Record<string, string> = {};
  for (const a of areas) {
    areaNames[a.id] = a.name;
  }

  const allFeatures = Array.from(
    new Set(apartments.flatMap((apt) => apt.features).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Apartments</h1>
      <p className="mt-2 text-slate-600">
        View all listings. Filter by price, size (sqm), and features.
      </p>

      <ApartmentsList
        apartments={apartments}
        areaNames={areaNames}
        allFeatures={allFeatures}
      />
    </div>
  );
}
