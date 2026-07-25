"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="studio-atmosphere relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="studio-grain pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative w-full max-w-md animate-fade-up">
        <p className="font-display text-sm font-semibold tracking-wide text-ocean">
          Admin
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-charcoal sm:text-4xl">
          Da Nang Expat Rentals
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Sign in to manage listings, areas, and content.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5 rounded-soft border border-line/80 bg-white/80 p-7 shadow-[0_18px_50px_rgba(42,42,40,0.06)] backdrop-blur-sm"
        >
          <div>
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="field-input"
            />
          </div>
          {error && (
            <p className="text-sm text-coral-deep" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
