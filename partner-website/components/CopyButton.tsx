"use client";

import { useState } from "react";
import { capture, type AnalyticsProperties } from "@/lib/analytics";

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  className = "",
  event,
  eventProps,
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  event?: string;
  eventProps?: AnalyticsProperties;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (event) capture(event, eventProps);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={
        className ||
        "rounded-quieter border border-line bg-white px-3.5 py-2 text-sm font-medium text-charcoal transition hover:border-ocean/40 hover:text-ocean"
      }
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
