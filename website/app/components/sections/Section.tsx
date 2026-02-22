import { CONTENT_CONTAINER, SECTION_PADDING } from "@/app/lib/constants";

type SectionProps = {
  /** Background class (e.g. "bg-white", "bg-slate-50", "bg-slate-900") */
  bg: string;
  /** Extra class names for the section element */
  className?: string;
  /** If true, render children inside CONTENT_CONTAINER. If false, children only (for custom layout) */
  withContainer?: boolean;
  children: React.ReactNode;
};

/**
 * Full-width section with consistent padding. Use for any section that has its own background
 * so the bg runs edge-to-edge while content stays in the content band.
 */
export function Section({
  bg,
  className = "",
  withContainer = true,
  children,
}: SectionProps) {
  return (
    <section className={`w-full ${SECTION_PADDING} ${bg} ${className}`.trim()}>
      {withContainer ? (
        <div className={CONTENT_CONTAINER}>{children}</div>
      ) : (
        children
      )}
    </section>
  );
}
