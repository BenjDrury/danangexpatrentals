"use client";

import { useEffect } from "react";
import { identifyUser, type AnalyticsPerson } from "@/lib/analytics";

/** Sync PostHog person + company group from the studio session (or opt out for admins). */
export function AnalyticsIdentity(person: AnalyticsPerson) {
  useEffect(() => {
    identifyUser(person);
  }, [
    person.id,
    person.email,
    person.name,
    person.role,
    person.isAdmin,
    person.companyId,
    person.companyName,
    person.companyPageUrl,
    person.companyFollowers,
    person.companyFacebookId,
    person.isImpersonating,
  ]);

  return null;
}
