import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "./AdminNav";
import { SignOutButton } from "./SignOutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await requireAdmin();
  if (!result) {
    redirect("/unauthorized");
  }

  return (
    <div className="studio-atmosphere relative min-h-screen">
      <div className="studio-grain pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <header className="relative border-b border-line/70 bg-white/55 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-ocean">
                Admin
              </p>
              <p className="mt-1 font-display text-lg font-semibold text-charcoal sm:text-xl">
                Da Nang Expat Rentals
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 text-right">
              <span className="max-w-[14rem] truncate text-xs text-muted sm:text-sm">
                {result.user.email}
              </span>
              <SignOutButton />
            </div>
          </div>
          <AdminNav />
        </div>
      </header>
      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
