"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ClearStoragePage() {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [keys, setKeys] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState("");

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

    // Auto-set API key from URL param ?key=xxx
    const params = new URLSearchParams(window.location.search);
    const urlKey = params.get("key");
    if (urlKey) {
      localStorage.setItem("findash-finnhub-key", JSON.stringify(urlKey));
      router.push("/dashboard");
    }
  }, [router]);

  const handleSetKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("findash-finnhub-key", JSON.stringify(apiKey.trim()));
      router.push("/dashboard");
    }
  };

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
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste Finnhub API key"
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-xs outline-none"
            onKeyDown={(e) => { if (e.key === "Enter") handleSetKey(); }}
          />
          <button
            onClick={handleSetKey}
            disabled={!apiKey.trim()}
            className="rounded-lg bg-[var(--accent-green)] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Set & Go
          </button>
        </div>
        <button
          onClick={() => router.push("/onboarding")}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-blue)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Set up Dashboard →
        </button>
      </div>
    </div>
  );
}
