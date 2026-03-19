"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finishOAuth() {
      setError(null);
      try {
        const code = searchParams.get("code");

        // Some Supabase OAuth flows provide an auth code in the query string.
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (cancelled) return;

        if (session) {
          router.replace("/dashboard");
        } else {
          router.replace("/login");
        }
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "OAuth sign-in failed.");
        router.replace("/login");
      }
    }

    finishOAuth();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return error ? (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          Sign-in error
        </h1>
        <p className="mt-2 text-sm text-[var(--accent-red)]">{error}</p>
      </div>
    </div>
  ) : null;
}

