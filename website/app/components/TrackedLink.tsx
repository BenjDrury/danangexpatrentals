"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { capture, type AnalyticsProperties } from "@/lib/analytics";

type Props = {
  href: string;
  event: string;
  eventProps?: AnalyticsProperties;
  className?: string;
  children: ReactNode;
  external?: boolean;
};

/** Link that fires a named analytics event on click. */
export function TrackedLink({
  href,
  event,
  eventProps,
  className,
  children,
  external,
}: Props) {
  const isExternal = external ?? href.startsWith("http");
  return (
    <Link
      href={href}
      className={className}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={() => capture(event, { href, ...eventProps })}
    >
      {children}
    </Link>
  );
}
