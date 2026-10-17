"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/authClient";
import { errorMessage } from "@/lib/errors";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [registerOverride, setRegister] = useState<boolean | null>(null);
  const register = registerOverride ?? params.get("mode") === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let mounted = true;
    auth.getSession().then(session => { if (mounted && session) router.replace("/dashboard"); })
      .catch(error => { if (mounted) setError(errorMessage(error)); });
    return () => { mounted = false; };
  }, [router]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true); setError(null);
    try { await auth.signIn(email, password, register); router.replace(register ? "/onboarding" : "/dashboard"); }
    catch (error) { setError(errorMessage(error)); }
    finally { setLoading(false); }
  };
  return <main className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4 py-10">
    <div className="w-full max-w-md">
      <Link href="/" className="mb-8 flex items-center justify-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-blue)] text-xl font-bold text-white">F</span>
        <span><span className="block text-2xl font-bold">FinDash</span><span className="text-xs text-[var(--text-secondary)]">Your financial workspace</span></span>
      </Link>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7 shadow-xl">
        <h1 className="text-xl font-semibold">{register ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{register ? "Build a workspace for your markets and portfolio." : "Sign in to pick up where you left off."}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><label htmlFor="email" className="mb-1.5 block text-sm">Email</label>
            <input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 outline-none focus:border-[var(--accent-blue)]" /></div>
          <div><label htmlFor="password" className="mb-1.5 block text-sm">Password</label>
            <input id="password" type="password" autoComplete={register ? "new-password" : "current-password"} required minLength={10} maxLength={128}
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 outline-none focus:border-[var(--accent-blue)]" />
            {register && <p className="mt-1 text-xs text-[var(--text-muted)]">At least 10 characters. Keep your password somewhere safe.</p>}</div>
          {error && <p role="alert" className="rounded-lg bg-[var(--accent-red)]/10 p-3 text-sm text-[var(--accent-red)]">{error}</p>}
          <button disabled={loading} className="w-full rounded-lg bg-[var(--accent-blue)] py-3 font-semibold text-white disabled:opacity-50">
            {loading ? "Please wait…" : register ? "Create account" : "Sign in"}</button>
        </form>
        <button type="button" disabled={loading} onClick={() => { setRegister(!register); setError(null); }} className="mt-5 w-full text-sm text-[var(--accent-blue)]">
          {register ? "Already have an account? Sign in" : "New here? Create an account"}</button>
      </div>
      <p className="mt-5 text-center text-xs text-[var(--text-muted)]">Your workspace is saved on this FinDash server.</p>
    </div>
  </main>;
}
