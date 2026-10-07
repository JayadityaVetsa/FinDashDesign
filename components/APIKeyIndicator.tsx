"use client";
import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/apiClient";
export default function APIKeyIndicator({ apiKey }: { apiKey: string }) {
  const [result, setResult] = useState<{ key: string; valid: boolean } | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!apiKey.trim()) return;
    const timer = setTimeout(async () => {
      try {
        await new ApiClient({ apiKey: apiKey.trim() }).getQuote("AAPL");
        if (!cancelled) setResult({ key: apiKey, valid: true });
      } catch { if (!cancelled) setResult({ key: apiKey, valid: false }); }
    }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [apiKey]);
  const valid = result?.key === apiKey ? result.valid : null;
  return <div className={`h-2 w-2 shrink-0 rounded-full ${valid === true ? "bg-[var(--accent-green)]" : valid === false ? "bg-[var(--accent-red)]" : "bg-[var(--text-muted)]"}`}
    title={valid === true ? "Market data connected" : valid === false ? "Cannot verify market connection" : "Checking market connection"} />;
}
