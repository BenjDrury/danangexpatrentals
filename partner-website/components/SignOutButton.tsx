"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import posthog from "posthog-js";

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
    posthog.reset();
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
