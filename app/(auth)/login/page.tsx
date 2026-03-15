"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/dashboard");
      }
    });
  }, [router]);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError.message);
    } else {
      router.replace("/dashboard");
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError) {
      setError(signUpError.message);
    } else {
      router.replace("/dashboard");
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleSignIn();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[var(--accent)] opacity-[0.04] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[var(--accent)] opacity-[0.04] blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-lg font-bold text-white shadow-lg">
            F
          </div>
          <h1 className="text-2xl font-bold">FinDash</h1>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-xl">
          <h2 className="text-lg font-semibold">Welcome back</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Sign in to access your financial dashboard.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-[var(--danger)]/10 px-4 py-2.5 text-sm text-[var(--danger)]">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={handleSignIn}
                disabled={loading}
                className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                disabled={loading}
                className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-all hover:border-[var(--accent)] hover:bg-[var(--card-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create account
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
          Powered by Supabase Auth
        </p>
      </div>
    </div>
  );
}
