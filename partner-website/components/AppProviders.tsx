"use client";

import { useEffect } from "react";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { createClient } from "@/lib/supabase/client";
import { resetAnalytics } from "@/lib/analytics";
import { syncPostHogIdentity } from "@/lib/analytics-identity";

/**
 * Root providers. Keeps PostHog identity in sync with the Supabase session:
 * partners are identified by internal user id + display name as soon as they
 * are signed in; admins are fully opted out; identity is cleared on sign-out.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        resetAnalytics();
        return;
      }

      // Identify immediately on session restore and right after login.
      if (
        session?.user &&
        (event === "INITIAL_SESSION" ||
          event === "SIGNED_IN" ||
          event === "USER_UPDATED")
      ) {
        void syncPostHogIdentity(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <LocaleProvider>{children}</LocaleProvider>;
}
