"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ClearStoragePage() {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [keys, setKeys] = useState<string[]>([]);

  useEffect(() => {
    // Clear any leftover localStorage keys (theme cache, legacy data)
    const findashKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("findash")) {
        findashKeys.push(key);
      }
    }
    setKeys(findashKeys);
    findashKeys.forEach((key) => localStorage.removeItem(key));
    setDone(true);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
      <div className="max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold text-[var(--accent-green)]">
          {done ? "Storage Cleared" : "Clearing..."}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Removed {keys.length} cached key{keys.length !== 1 ? "s" : ""} from
          localStorage.
        </p>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Your dashboards, portfolio, and settings are stored in Supabase and
          are not affected.
        </p>
        {keys.length > 0 && (
          <ul className="mt-4 inline-block text-left text-xs text-[var(--text-muted)]">
            {keys.map((k) => (
              <li key={k}>• {k}</li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full rounded-lg bg-[var(--accent-blue)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Go to Dashboard →
          </button>
          <button
            onClick={handleSignOut}
            className="w-full rounded-lg border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-red)] hover:text-[var(--accent-red)]"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
