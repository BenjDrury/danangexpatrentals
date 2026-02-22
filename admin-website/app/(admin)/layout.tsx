import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
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
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="font-semibold text-slate-900">
            Da Nang Expat Rentals — Admin
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{result.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl gap-6 px-6 py-2">
          <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Dashboard
          </Link>
          <Link href="/areas" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Areas
          </Link>
          <Link href="/apartment-types" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Apartment types
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
