import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { UnauthorizedView } from "./UnauthorizedView";

export default async function UnauthorizedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Admins without a company link still belong in Admin, not this dead-end.
  if (user) {
    const profile = await getProfile(user.id);
    if (profile?.role === "admin") {
      redirect("/admin/partners");
    }
  }

  return <UnauthorizedView email={user?.email} />;
}
