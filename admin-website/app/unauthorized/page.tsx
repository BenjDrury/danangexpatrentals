import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="studio-atmosphere relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="studio-grain pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative max-w-md text-center animate-fade-up">
        <p className="font-display text-sm font-semibold tracking-wide text-ocean">
          Admin
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-charcoal">
          Access denied
        </h1>
        <p className="mt-3 text-muted">
          You don&apos;t have permission to view this area.
        </p>
        <Link href="/login" className="btn-primary mt-8 inline-flex">
          Back to login
        </Link>
      </div>
    </div>
  );
}
