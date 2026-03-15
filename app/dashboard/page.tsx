"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import DashboardGrid from "@/components/DashboardGrid";
import Header from "@/components/Header";
import ToastContainer, { showRateLimitToast } from "@/components/Toast";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { setGlobalRateLimitHandler } from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";
import { readStorage, storageKeys, writeStorage } from "@/lib/storage";

export default function DashboardPage() {
  const router = useRouter();
  // "committed" key that widgets actually use
  const [apiKey, setApiKey] = useState("");
  // "draft" key shown in the header input (may differ while user is typing)
  const [draftKey, setDraftKey] = useState("");
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Check for API key, redirect to onboarding if missing
    const finnhubKey = readStorage<string>(storageKeys.finnhubKey, "");
    const alphaKey = readStorage<string>(storageKeys.alphaVantageKey, "");
    const key = finnhubKey || alphaKey;
    
    if (!key) {
      router.push("/onboarding");
      return;
    }
    
    setApiKey(key);
    setDraftKey(key);
    setChecking(false);
  }, [router]);

  // Set up rate limit handler
  useEffect(() => {
    setGlobalRateLimitHandler((retryAfter) => {
      showRateLimitToast(retryAfter);
    });
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "r",
      meta: true,
      handler: () => {
        setRefreshKey((prev) => prev + 1); // Trigger refresh
      },
    },
  ]);

  // Only update the draft (input display). Widgets keep using the old key.
  const handleApiKeyDraftChange = useCallback((value: string) => {
    setDraftKey(value);
  }, []);

  // Commit the key: save to storage and pass to widgets.
  const handleApiKeyCommit = useCallback((value: string) => {
    const trimmed = value.trim();
    if (trimmed) {
      setApiKey(trimmed);
      setDraftKey(trimmed);
      writeStorage(storageKeys.finnhubKey, trimmed);
      setRefreshKey((p) => p + 1); // force re-render widgets
    }
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleStockSelect = (symbol: string) => {
    setSelectedStock(symbol);
    // Could update a focused widget here
  };

  if (checking) {
    return (
      <AuthGate>
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
          <div className="text-sm text-[var(--text-secondary)]">Loading...</div>
        </div>
      </AuthGate>
    );
  }

  return (
    <AuthGate>
      <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
        <Header
          apiKey={draftKey}
          onApiKeyChange={handleApiKeyDraftChange}
          onApiKeyCommit={handleApiKeyCommit}
          onSignOut={handleSignOut}
          onStockSelect={handleStockSelect}
        />
        <main className="mx-auto w-full max-w-[1920px] flex-1 px-4 py-4">
          <DashboardGrid key={refreshKey} apiKey={apiKey} onStockSelect={handleStockSelect} />
        </main>
        <ToastContainer />
      </div>
    </AuthGate>
  );
}
