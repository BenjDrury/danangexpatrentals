import Link from "next/link";

type CtaButtonProps = {
  href: string;
  primary?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function CtaButton({
  href,
  primary,
  children,
  className = "",
}: CtaButtonProps) {
  const isExternal = href.startsWith("http");
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold transition-all duration-200";
  const styles = primary
    ? "bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/30"
    : "border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50";
  return (
    <Link
      href={href}
      {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </Link>
  );
}
