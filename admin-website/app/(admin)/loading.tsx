export default function AdminLoading() {
  return (
    <div className="animate-fade-up" aria-busy="true" aria-live="polite">
      <div className="h-8 w-40 rounded-quieter bg-sand-deep/50" />
      <div className="mt-3 h-4 w-72 max-w-full rounded-quieter bg-sand-deep/35" />
      <div className="mt-10 space-y-4">
        <div className="h-24 rounded-soft border border-line/60 bg-white/50" />
        <div className="h-24 rounded-soft border border-line/60 bg-white/50" />
        <div className="h-40 rounded-soft border border-line/60 bg-white/50" />
      </div>
    </div>
  );
}
