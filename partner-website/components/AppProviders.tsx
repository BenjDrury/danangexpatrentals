"use client";

import { useEffect } from "react";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { createClient } from "@/lib/supabase/client";
import { disableAnalyticsForAdmin, identifyUser } from "@/lib/analytics";

/**
 * Root providers. On mount, sync PostHog with the Supabase session:
 * partners are identified (+ company when known later via AnalyticsIdentity);
 * admins are fully opted out.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, display_name, estate_company_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role === "admin") {
        disableAnalyticsForAdmin();
        return;
      }

      identifyUser({
        id: user.id,
        email: user.email,
        name: profile?.display_name ?? null,
        role: profile?.role ?? null,
        companyId: profile?.estate_company_id ?? null,
        isAdmin: false,
      });
    })();
  }, []);

  return <LocaleProvider>{children}</LocaleProvider>;
}
