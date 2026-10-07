"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, type Session } from "@/lib/authClient";
import { errorMessage } from "@/lib/errors";
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let mounted = true;
    auth.getSession().then(session => {
      if (!mounted) return;
      setSession(session); setLoading(false); setError(null);
      if (!session) router.replace("/login");
    }).catch(error => { if (mounted) { setError(errorMessage(error)); setLoading(false); } });
    const unsubscribe = auth.subscribe(next => {
      if (!mounted) return;
      setSession(next);
      if (!next) router.replace("/login");
    });
    return () => { mounted = false; unsubscribe(); };
  }, [router, attempt]);
  if (error) return <main className="flex min-h-screen items-center justify-center p-6"><div className="max-w-md text-center">
    <h1 className="text-xl font-semibold">Unable to connect</h1><p role="alert" className="mt-3 text-sm">{error}</p>
    <button onClick={() => setAttempt(n => n + 1)} className="mt-4 rounded-lg bg-[var(--accent-blue)] px-5 py-2 text-white">Retry</button>
  </div></main>;
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--border)] border-t-[var(--accent-blue)]" /></div>;
  return session ? <>{children}</> : null;
}
