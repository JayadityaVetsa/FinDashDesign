"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

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
      // Dashboard page will load this user's profile from Supabase
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
      // The Supabase trigger auto-creates a profile row.
      // Dashboard page will detect onboarding_completed = false → redirect to /onboarding
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
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[var(--accent-blue)] opacity-[0.08] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[var(--accent-green)] opacity-[0.06] blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-blue)] text-lg font-bold text-white shadow-lg">
            F
          </div>
          <div className="flex flex-col items-start">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              FinDash
            </h1>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Your financial workspace
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 shadow-xl backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Sign in or create an account to access your personal financial
            dashboard.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-[var(--accent-blue)]/20"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-[var(--accent-blue)]/25"
                placeholder="••••••••"
              />
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                At least 6 characters. Passwords are stored securely by
                Supabase.
              </p>
            </div>

            {error && (
              <div className="rounded-xl bg-[var(--accent-red)]/10 px-4 py-2.5 text-sm text-[var(--accent-red)]">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={handleSignIn}
                disabled={loading}
                className="flex-1 rounded-xl bg-[var(--accent-blue)] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                disabled={loading}
                className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-all hover:border-[var(--accent-blue)] hover:bg-[var(--bg-card-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create account
              </button>
            </div>

            <p className="pt-1 text-xs text-[var(--text-secondary)]">
              New accounts go through a quick onboarding step to connect your
              free Finnhub API key and choose a dashboard preset.
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-[var(--text-secondary)]">
          <span>Powered by Supabase Auth · </span>
          <span>Your dashboards sync across devices.</span>
        </p>

        <p className="mt-2 text-center text-[11px] text-[var(--text-muted)]">
          <Link href="/" className="hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
