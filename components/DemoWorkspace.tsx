"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { DemoModeProvider } from "@/lib/DemoContext";
import { UserProvider } from "@/lib/UserContext";
import { demoWidgets, DEMO_HOLDINGS, isDemoLayout } from "@/lib/demoData";
import type { WidgetConfig } from "@/lib/widgetConfig";
import { readStorage, writeStorage } from "@/lib/storage";
import DashboardGrid from "./DashboardGrid";

const storageKey = "findash-public-demo-widgets-v1";
export default function DemoWorkspace() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(demoWidgets);
  const [ready, setReady] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const stored = readStorage<WidgetConfig[] | null>(storageKey, null);
      if (isDemoLayout(stored)) setWidgets(stored);
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const update = (next: WidgetConfig[]) => { setWidgets(next); writeStorage(storageKey, next); };
  const reset = () => {
    update(demoWidgets());
    try { localStorage.removeItem("findash-holdings-draft-public-demo"); } catch { /* unavailable */ }
    setResetKey(k => k + 1);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/demo`); setCopied(true); }
    catch { setCopied(false); }
  };
  return <div className="min-h-screen bg-[var(--bg-primary)]">
    <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-4">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-lg font-bold">FinDash <span className="ml-2 rounded-full bg-[var(--accent-blue)]/15 px-2 py-1 text-xs font-medium text-[var(--accent-blue)]">Interactive demo</span></Link>
        <div className="flex items-center gap-4 text-sm"><button onClick={reset}>Reset demo</button><button onClick={copy}>{copied ? "Link copied" : "Copy demo link"}</button><Link href="/login?mode=signup" className="rounded-lg bg-[var(--accent-blue)] px-4 py-2 font-semibold text-white">Create your workspace</Link></div>
      </div>
    </header>
    <main className="mx-auto max-w-7xl px-3 pb-24 pt-6 sm:px-6">
      <div className="mb-5 rounded-xl border border-[var(--accent-amber)]/30 bg-[var(--accent-amber)]/5 p-4">
        <h1 className="text-xl font-semibold">Try your first financial workspace</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]"><strong className="text-[var(--accent-amber)]">Illustrative sample data, not live prices or real news.</strong> Drag and resize widgets, edit the watchlist, and change the sample holdings. Edits stay in this browser. No account, API key, or brokerage connection is needed.</p>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">Not sure where to start? <Link href="/guides/first-stock-watchlist" className="text-[var(--accent-blue)] underline">Follow the first-watchlist guide</Link>. Your real account starts with its own setup; demo edits are not uploaded.</p>
      </div>
      {ready ? <DemoModeProvider><UserProvider key={resetKey} userId="public-demo" initialHoldings={DEMO_HOLDINGS} localOnly>
        <DashboardGrid apiKey="sample-data" widgets={widgets} onWidgetsChange={update} />
      </UserProvider></DemoModeProvider> : <p role="status">Loading the interactive demo…</p>}
    </main>
  </div>;
}
