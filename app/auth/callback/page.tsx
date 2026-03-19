import { Suspense } from "react";
import AuthCallbackClient from "./AuthCallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-3 border-[var(--border)] border-t-[var(--accent-blue)]" />
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              Signing you in…
            </h1>
          </div>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}

