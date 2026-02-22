import Link from "next/link";
import { getApartmentTypes } from "@/lib/data";

export default async function AdminApartmentTypesPage() {
  const types = await getApartmentTypes();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Apartment types</h1>
      <p className="mt-2 text-slate-600">
        Edit the &quot;What we help you find&quot; cards on the main apartments page.
      </p>

      {types.length === 0 ? (
        <p className="mt-6 text-slate-500">No apartment types yet. Run the Supabase seed or add in Supabase Table Editor.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {types.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div>
                <span className="font-medium text-slate-900">{t.title}</span>
                <p className="mt-0.5 text-sm text-slate-500 line-clamp-1">{t.desc}</p>
              </div>
              <Link
                href={`/apartment-types/${t.id}/edit`}
                className="shrink-0 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
