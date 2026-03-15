"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ClearStoragePage() {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [keys, setKeys] = useState<string[]>([]);

  useEffect(() => {
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
      <div className="max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold text-[var(--accent-green)]">
          {done ? "✅ Storage Cleared" : "Clearing..."}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Removed {keys.length} cached key{keys.length !== 1 ? "s" : ""}.
        </p>
        {keys.length > 0 && (
          <ul className="mt-4 inline-block text-left text-xs text-[var(--text-muted)]">
            {keys.map((k) => (
              <li key={k}>• {k}</li>
            ))}
          </ul>
        )}
        <button
          onClick={() => router.push("/onboarding")}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-blue)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Set up Dashboard →
        </button>
      </div>
    </div>
  );
}
