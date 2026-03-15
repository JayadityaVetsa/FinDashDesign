"use client";

import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/apiClient";

type APIKeyIndicatorProps = {
  apiKey: string;
};

export default function APIKeyIndicator({ apiKey }: APIKeyIndicatorProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!apiKey || apiKey.trim().length === 0) {
      setIsValid(null);
      return;
    }

    // Test API key by making a simple request
    const testKey = async () => {
      try {
        const client = new ApiClient({ apiKey: apiKey.trim() });
        await client.getQuote("AAPL"); // Test with a common ticker
        setIsValid(true);
      } catch (error) {
        setIsValid(false);
      }
    };

    const timeout = setTimeout(testKey, 500); // Debounce
    return () => clearTimeout(timeout);
  }, [apiKey]);

  if (isValid === null) {
    return (
      <div className="h-2 w-2 rounded-full bg-[var(--text-muted)]" title="No API key" />
    );
  }

  return (
    <div
      className={`h-2 w-2 rounded-full ${
        isValid ? "bg-[var(--accent-green)]" : "bg-[var(--accent-red)]"
      } ${isValid ? "shadow-[0_0_8px_rgba(34,197,94,0.6)]" : ""}`}
      title={isValid ? "API key valid" : "API key invalid"}
    />
  );
}
