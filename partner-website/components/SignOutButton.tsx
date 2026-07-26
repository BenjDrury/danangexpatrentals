"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { capture, resetAnalytics } from "@/lib/analytics";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({
  className = "text-sm font-medium text-muted transition hover:text-charcoal",
}: SignOutButtonProps) {
  const router = useRouter();
  const { t } = useLocale();

  async function signOut() {
    const supabase = createClient();
    capture("user_signed_out");
    resetAnalytics();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} className={className}>
      {t("nav.signOut")}
    </button>
  );
}
