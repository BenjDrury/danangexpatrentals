export function Section({
  title,
  description,
  children,
  className = "",
  actions,
  bare = false,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  /** Skip card chrome — divider + header only. */
  bare?: boolean;
}) {
  const body = (
    <>
      {(title || actions) && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {title ? (
              <h2 className="font-display text-base font-semibold text-charcoal">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-sm text-muted">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
      )}
      {children}
    </>
  );

  if (bare) {
    return <section className={className}>{body}</section>;
  }

  return (
    <section
      className={`rounded-lg border border-line/80 bg-white/70 p-4 ${className}`}
    >
      {body}
    </section>
  );
}
