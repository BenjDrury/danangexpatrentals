"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function updateArea(
  id: string,
  formData: { name: string; image: string; vibe: string; price_range: string; who: string }
) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized. Only admins can edit areas." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("areas")
    .update({
      name: formData.name,
      image: formData.image,
      vibe: formData.vibe,
      price_range: formData.price_range,
      who: formData.who,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/areas");
  revalidatePath(`/areas/${id}/edit`);
  return { error: null };
}
