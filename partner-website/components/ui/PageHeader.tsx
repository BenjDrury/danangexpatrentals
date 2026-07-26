export function PageHeader({
  title,
  subtitle,
  actions,
  back,
  meta,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  back?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {back}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-charcoal">
          {title}
        </h1>
        {subtitle ? <div className="mt-1 text-sm text-muted">{subtitle}</div> : null}
        {meta ? <div className="mt-2">{meta}</div> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
