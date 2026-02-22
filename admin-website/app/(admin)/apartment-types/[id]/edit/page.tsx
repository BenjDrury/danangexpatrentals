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
    <div>
      <Link href="/apartment-types" className="text-sm font-medium text-teal-600 hover:text-teal-700">
        ← Apartment types
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Edit: {type_.title}</h1>

      <ApartmentTypeEditForm type_={type_} />
    </div>
  );
}
