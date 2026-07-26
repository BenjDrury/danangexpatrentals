"use client";

import posthog from "posthog-js";
import { ANALYTICS_OPT_OUT_COOKIE, COMPANY_GROUP_TYPE } from "@/lib/analytics-constants";

export { COMPANY_GROUP_TYPE };

export type AnalyticsPerson = {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  isAdmin?: boolean;
  companyId?: string | null;
  companyName?: string | null;
  companyPageUrl?: string | null;
  companyFollowers?: number | null;
  companyFacebookId?: string | null;
  isImpersonating?: boolean;
};

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

let adminOptedOut = false;

function cookieOptedOut(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c === `${ANALYTICS_OPT_OUT_COOKIE}=1`);
}

function isCapturingDisabled(): boolean {
  if (adminOptedOut || cookieOptedOut()) return true;
  try {
    return Boolean(posthog.has_opted_out_capturing?.());
  } catch {
    return false;
  }
}

/** Opt out of all PostHog capture (pageviews, autocapture, custom events). */
export function disableAnalyticsForAdmin(): void {
  adminOptedOut = true;
  try {
    posthog.opt_out_capturing();
    posthog.reset(true);
  } catch {
    /* PostHog may not be ready yet */
  }
}

/**
 * Identify the signed-in partner and attach them to their estate company group.
 * Admins are fully opted out — no identify, groups, or events.
 */
export function identifyUser(person: AnalyticsPerson): void {
  if (person.isAdmin || person.role === "admin" || cookieOptedOut()) {
    disableAnalyticsForAdmin();
    return;
  }

  adminOptedOut = false;
  try {
    posthog.opt_in_capturing();
  } catch {
    /* ignore */
  }

  posthog.identify(person.id, {
    email: person.email ?? undefined,
    name: person.name ?? undefined,
    role: person.role ?? "partner",
    estate_company_id: person.companyId ?? undefined,
    company_name: person.companyName ?? undefined,
  });

  if (person.companyId) {
    posthog.group(COMPANY_GROUP_TYPE, person.companyId, {
      name: person.companyName ?? undefined,
      page_url: person.companyPageUrl ?? undefined,
      page_followers: person.companyFollowers ?? undefined,
      facebook_id: person.companyFacebookId ?? undefined,
    });
  }
}

/** Fire a custom event. No-ops for admins / opted-out sessions. */
export function capture(event: string, properties?: AnalyticsProperties): void {
  if (isCapturingDisabled()) return;
  posthog.capture(event, properties);
}

/** Clear identity on sign-out and re-enable capturing for the next anonymous/partner session. */
export function resetAnalytics(): void {
  adminOptedOut = false;
  try {
    posthog.opt_in_capturing();
    posthog.reset();
  } catch {
    /* ignore */
  }
}
