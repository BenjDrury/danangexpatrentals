"use client";

import { useEffect } from "react";
import { createAuthClient } from "@/lib/supabase/auth-client";
import { resetAnalytics } from "@/lib/analytics";
import { syncPostHogIdentity } from "@/lib/analytics-identity";

/**
 * Keeps PostHog in sync with the shared Supabase session from partner/admin hosts:
 * partners are identified; admins are opted out; signed-out stays anonymous.
 */
export function AuthAnalytics() {
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    try {
      const supabase = createAuthClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (cancelled) return;
        if (event === "SIGNED_OUT") {
          resetAnalytics();
          return;
        }
        if (
          session?.user &&
          (event === "INITIAL_SESSION" ||
            event === "SIGNED_IN" ||
            event === "USER_UPDATED" ||
            event === "TOKEN_REFRESHED")
        ) {
          void syncPostHogIdentity(session.user);
        }
      });
      unsubscribe = () => subscription.unsubscribe();
    } catch {
      /* Missing Supabase env in local/preview — stay anonymous */
    }

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return null;
}
