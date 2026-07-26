import { PostHog } from "posthog-node";

let client: PostHog | null = null;

function getClient(): PostHog | null {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN missing — server analytics events are skipped.",
      );
    }
    return null;
  }

  if (!client) {
    client = new PostHog(token, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

/** Public-site server capture (anonymous leads, etc.). */
export async function captureServer(
  event: string,
  properties: AnalyticsProperties = {},
  distinctId = "anonymous",
): Promise<void> {
  const posthog = getClient();
  if (!posthog) return;

  posthog.capture({
    distinctId,
    event,
    properties,
  });
  await posthog.flush();
}

/** @deprecated Prefer captureServer. */
export function getPostHogClient(): PostHog | null {
  return getClient();
}
