export default function SiteLoading() {
  return (
    <div className="min-h-[50vh] bg-foam px-4 py-16 sm:px-6" aria-busy="true" aria-live="polite">
      <div className="mx-auto max-w-6xl animate-pulse space-y-6">
        <div className="h-10 w-56 rounded-xl bg-sand-deep/45" />
        <div className="h-4 w-80 max-w-full rounded-lg bg-sand-deep/30" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="aspect-[4/3] rounded-2xl bg-sand-deep/25" />
          <div className="aspect-[4/3] rounded-2xl bg-sand-deep/25" />
          <div className="aspect-[4/3] rounded-2xl bg-sand-deep/25" />
        </div>
      </div>
    </div>
  );
}
