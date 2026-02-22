"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function updateApartmentType(
  id: string,
  formData: { title: string; desc: string; sort_order: string }
) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized. Only admins can edit apartment types." };

  const supabase = await createClient();
  const sortOrder = parseInt(formData.sort_order, 10);
  if (Number.isNaN(sortOrder)) return { error: "Sort order must be a number" };

  const { error } = await supabase
    .from("apartment_types")
    .update({
      title: formData.title,
      desc: formData.desc,
      sort_order: sortOrder,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/apartment-types");
  revalidatePath(`/apartment-types/${id}/edit`);
  return { error: null };
}
