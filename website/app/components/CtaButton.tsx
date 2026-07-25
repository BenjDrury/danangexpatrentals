import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type CtaVariant = "primary" | "secondary" | "onDark" | "onDarkSecondary";

type CtaButtonProps = {
  href: string;
  /** @deprecated Prefer variant="primary" */
  primary?: boolean;
  variant?: CtaVariant;
  children: ReactNode;
  className?: string;
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

export function CtaButton({
  href,
  primary,
  variant,
  children,
  className = "",
}: CtaButtonProps) {
  const isExternal = href.startsWith("http");
  const resolved: CtaVariant = variant ?? (primary ? "primary" : "secondary");
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3.5 text-base font-semibold transition-opacity duration-300 ease-soft hover:opacity-90";

  return (
    <Link
      href={href}
      {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
      className={`${base} ${className}`}
      style={VARIANT_STYLES[resolved]}
    >
      {children}
    </Link>
  );
}
