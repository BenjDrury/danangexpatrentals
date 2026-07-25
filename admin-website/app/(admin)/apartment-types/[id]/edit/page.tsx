import Link from "next/link";
import { notFound } from "next/navigation";
import { getApartmentTypeById } from "@/lib/data";
import { ApartmentTypeEditForm } from "../ApartmentTypeEditForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditApartmentTypePage({ params }: Props) {
  const { id } = await params;
  const type_ = await getApartmentTypeById(id);
  if (!type_) notFound();

  return (
    <div className="animate-fade-up">
      <Link
        href="/apartment-types"
        className="text-sm font-medium text-ocean transition hover:text-ocean-deep"
      >
        ← Apartment types
      </Link>
      <h1 className="mt-4 page-title">Edit: {type_.title}</h1>

      <ApartmentTypeEditForm type_={type_} />
    </div>
  );
}
