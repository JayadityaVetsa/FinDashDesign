"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/dashboard");
      }
    });
  }, [router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      // PKCE requires the callback to return to the same browser origin that initiated login.
      // Using runtime origin avoids preview-vs-production domain mismatch issues on Vercel.
      const appBase = window.location.origin.replace(/\/$/, "");
      const redirectTo = `${appBase}/auth/callback`;
      const { error: oauthError, data } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (oauthError) {
        setError(oauthError.message);
        return;
      }

      // Supabase should return a URL to complete redirect (especially in OAuth redirect flows).
      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      // Fallback: if no URL returned, the client should still handle the redirect via session-in-URL detection.
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) router.replace("/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start Google sign-in.");
    } finally {
      setLoading(false);
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
            Sign in with Google
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Continue with Google to access your personal financial dashboard.
          </p>

          <div className="mt-6 space-y-4">
            {error && (
              <div className="rounded-xl bg-[var(--accent-red)]/10 px-4 py-2.5 text-sm text-[var(--accent-red)]">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex-1 rounded-xl bg-[var(--accent-blue)] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Redirecting…" : "Continue with Google"}
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
