"use client";

import { useEffect } from "react";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { createClient } from "@/lib/supabase/client";
import posthog from "posthog-js";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        posthog.identify(data.user.id, { email: data.user.email });
      }
    });
  }, []);

  return <LocaleProvider>{children}</LocaleProvider>;
}
