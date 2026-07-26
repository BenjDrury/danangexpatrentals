"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { capture, type AnalyticsProperties } from "@/lib/analytics";

type CtaVariant = "primary" | "secondary" | "onDark" | "onDarkSecondary";

type CtaButtonProps = {
  href: string;
  /** @deprecated Prefer variant="primary" */
  primary?: boolean;
  variant?: CtaVariant;
  children: ReactNode;
  className?: string;
  /** Named PostHog event. If omitted, inferred from href when possible. */
  event?: string;
  eventProps?: AnalyticsProperties;
};

/**
 * Explicit hex colors via inline styles so contrast never inherits
 * from a parent `text-white` / light background.
 */
const VARIANT_STYLES: Record<CtaVariant, CSSProperties> = {
  primary: {
    backgroundColor: "#2f6f7e",
    color: "#ffffff",
    borderColor: "transparent",
  },
  secondary: {
    backgroundColor: "transparent",
    color: "#2a2a28",
    borderColor: "#cfc7bb",
  },
  onDark: {
    backgroundColor: "#ffffff",
    color: "#2a2a28",
    borderColor: "transparent",
  },
  onDarkSecondary: {
    backgroundColor: "rgba(255,255,255,0.16)",
    color: "#ffffff",
    borderColor: "rgba(255,255,255,0.7)",
  },
};

function inferEvent(href: string): { event: string; props: AnalyticsProperties } | null {
  const lower = href.toLowerCase();
  if (lower.includes("wa.me") || lower.includes("whatsapp")) {
    return { event: "whatsapp_cta_clicked", props: { href, source: "cta_button" } };
  }
  if (lower.startsWith("/contact") || lower.includes("/contact?")) {
    return { event: "contact_cta_clicked", props: { href, source: "cta_button" } };
  }
  if (lower.startsWith("/partners")) {
    return { event: "partners_cta_clicked", props: { href, source: "cta_button" } };
  }
  if (lower === "/apartments" || lower.startsWith("/apartments?")) {
    return { event: "explore_apartments_clicked", props: { href, source: "cta_button" } };
  }
  if (lower.startsWith("/areas/") && lower !== "/areas") {
    return { event: "area_guide_clicked", props: { href, source: "cta_button" } };
  }
  if (lower === "/areas") {
    return { event: "neighbourhoods_cta_clicked", props: { href, source: "cta_button" } };
  }
  if (lower.startsWith("/how-it-works") || lower.startsWith("/why-us")) {
    return { event: "trust_page_cta_clicked", props: { href, source: "cta_button" } };
  }
  return { event: "cta_clicked", props: { href, source: "cta_button" } };
}

export function CtaButton({
  href,
  primary,
  variant,
  children,
  className = "",
  event,
  eventProps,
}: CtaButtonProps) {
  const isExternal = href.startsWith("http");
  const resolved: CtaVariant = variant ?? (primary ? "primary" : "secondary");
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3.5 text-base font-semibold transition-opacity duration-300 ease-soft hover:opacity-90";

  function onClick() {
    if (event) {
      capture(event, { href, ...eventProps });
      return;
    }
    const inferred = inferEvent(href);
    if (inferred) capture(inferred.event, { ...inferred.props, ...eventProps });
  }

  return (
    <Link
      href={href}
      {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
      onClick={onClick}
      className={`${base} ${className}`}
      style={VARIANT_STYLES[resolved]}
    >
      {children}
    </Link>
  );
}
