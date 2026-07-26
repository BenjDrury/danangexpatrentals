import Link from "next/link";
import { getApartmentTypes } from "@/lib/data";

export default async function AdminApartmentTypesPage() {
  const types = await getApartmentTypes();

  return (
    <div className="animate-fade-up">
      <h1 className="page-title">Apartment types</h1>
      <p className="page-lead">
        Edit the &quot;What we help you find&quot; cards on the main apartments page.
      </p>

      {types.length === 0 ? (
        <p className="mt-6 text-muted">
          No apartment types yet. Run the Supabase seed or add in Supabase Table Editor.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-line/80 border-y border-line/80">
          {types.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <span className="font-display text-lg font-semibold text-charcoal">
                    {t.title}
                  </span>
                  <span className="text-xs font-medium text-muted">
                    Sort {t.sort_order}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted line-clamp-1">{t.desc}</p>
              </div>
              <Link
                href={`/apartment-types/${t.id}/edit`}
                className="btn-primary shrink-0 px-3 py-1.5"
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
