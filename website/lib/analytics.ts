"use client";

import posthog from "posthog-js";

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

/** Public-site event capture — single entry point for PostHog. */
export function capture(event: string, properties?: AnalyticsProperties): void {
  try {
    posthog.capture(event, properties);
  } catch {
    /* never break UX for analytics */
  }
}
