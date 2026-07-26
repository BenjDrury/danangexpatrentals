import posthog from "posthog-js";
import { ANALYTICS_OPT_OUT_COOKIE } from "@/lib/analytics-constants";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (!token && process.env.NODE_ENV !== "production") {
  console.error(
    "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, " +
      "this causes events to be silently missed. " +
      "This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured",
  );
}

function isOptedOutByCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c === `${ANALYTICS_OPT_OUT_COOKIE}=1`);
}

if (token) {
  const optedOut = isOptedOutByCookie();
  posthog.init(token, {
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: !optedOut,
    opt_out_capturing_by_default: optedOut,
    debug: process.env.NODE_ENV === "development",
  });
}

export { posthog };
