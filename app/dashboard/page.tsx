"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import DashboardGrid from "@/components/DashboardGrid";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import CommandPalette from "@/components/CommandPalette";
import ToastContainer, { showToast, showRateLimitToast } from "@/components/Toast";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ApiClient, setGlobalRateLimitHandler } from "@/lib/apiClient";
import type { Holding } from "@/lib/models";
import { auth } from "@/lib/authClient";

import { UserProvider } from "@/lib/UserContext";
import { getProfile, getUserDashboards, updateProfile, updateDashboard,
  createDashboard, deleteDashboard, seedDashboards } from "@/lib/data";
import { createSeedDashboards, type WidgetConfig } from "@/lib/widgetConfig";
import { errorMessage } from "@/lib/errors";
import { SaveQueue, registerSaveQueue } from "@/lib/saveQueue";
import { readStorage, writeStorage, type Dashboard } from "@/lib/storage";
import { clearCache } from "@/lib/cache";

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [initialHoldings, setInitialHoldings] = useState<Holding[]>([]);
  const [checking, setChecking] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [draftKey, setDraftKey] = useState("");
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [activeId, setActiveId] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [queue, setQueue] = useState<SaveQueue<WidgetConfig[]> | null>(null);

  const reportError = useCallback((error: unknown) => {
    showToast({ type: "error", message: errorMessage(error) });
  }, []);

  useEffect(() => {

    let cancelled = false;
    async function init() {
      try {
        setChecking(true);
        setLoadError(null);
        const session = await auth.getSession();

        if (!session) { router.replace("/login"); return; }
        const uid = session.user.id;
        const profile = await getProfile(uid);
        if (cancelled) return;
        if (!profile?.onboarding_completed || !profile.finnhub_key) {
          router.replace("/onboarding"); return;
        }
        // Failed reads must never seed dashboards or reset a user's workspace.
        let boards = await getUserDashboards(uid);
        if (cancelled) return;
        if (!boards.length) boards = await seedDashboards(uid, createSeedDashboards());
        if (cancelled) return;
        const draftPrefix = `findash-draft-${uid}-`;
        const saves: SaveQueue<WidgetConfig[]> = new SaveQueue(async (id, widgets) => {
          await updateDashboard(id, { widgets });
          const saved = readStorage<WidgetConfig[] | null>(draftPrefix + id, null);
          if (JSON.stringify(saved) === JSON.stringify(widgets)) {
            try { localStorage.removeItem(draftPrefix + id); } catch { /* unavailable */ }
          }
        }, (error) => setSaveError(errorMessage(error)), () => setSaving(saves.busy));
        const restored = boards.map((board) => {
          const draft = readStorage<WidgetConfig[] | null>(draftPrefix + board.id, null);
          if (draft && Array.isArray(draft)) saves.schedule(board.id, draft);
          return { ...board, widgets: draft ?? board.widgets ?? [] };
        });
        setQueue(saves);
        setUserId(uid);
        setInitialHoldings(profile.portfolio_holdings);
        setDashboards(restored);
        const active = restored.some(b => b.id === profile.active_dashboard_id)
          ? profile.active_dashboard_id! : restored[0].id;
        setActiveId(active);
        setApiKey(profile.finnhub_key);
        setDraftKey(profile.finnhub_key);
        setSidebarCollapsed(profile.sidebar_collapsed);
        document.documentElement.classList.toggle("dark", profile.theme !== "light");
        try { localStorage.setItem("findash-theme", profile.theme); } catch { /* unavailable */ }
        if (active !== profile.active_dashboard_id) await updateProfile(uid, { active_dashboard_id: active });
        if (!cancelled) setChecking(false);
      } catch (error) {
        if (!cancelled) { setLoadError(errorMessage(error)); setChecking(false); }
      }
    }
    void init();
    return () => { cancelled = true; };
  }, [router, loadAttempt]);

  useEffect(() => {
    setGlobalRateLimitHandler(showRateLimitToast);
    return () => setGlobalRateLimitHandler(undefined);
  }, []);

  useEffect(() => {
    if (!queue) return;
    const unregister = registerSaveQueue(queue);
    const warn = (event: BeforeUnloadEvent) => {
      if (queue.busy) { event.preventDefault(); event.returnValue = ""; }
    };
    const flush = () => { void queue.flushAll(); };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("pagehide", flush);
    return () => {
      unregister();
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("pagehide", flush);
      void queue.flushAll();
    };
  }, [queue]);

  const refresh = () => { clearCache(); setRefreshKey(k => k + 1); };
  useKeyboardShortcuts([
    { key: "r", meta: true, handler: refresh },
    { key: "k", meta: true, handler: () => setSearchOpen(true) },
  ]);

  const handleSelectDashboard = useCallback((id: string) => {
    setActiveId(id);
    if (userId) void updateProfile(userId, { active_dashboard_id: id }).catch(reportError);
  }, [userId, reportError]);

  const handleCreateDashboard = async (name: string) => {
    try {
      const board = await createDashboard(userId, name.trim() || "Untitled Dashboard", [], dashboards.length);
      setDashboards(prev => [...prev, board]);
      handleSelectDashboard(board.id);
    } catch (error) { reportError(error); }
  };
  const handleRenameDashboard = async (id: string, name: string) => {
    try {
      await updateDashboard(id, { name: name.trim() || "Untitled Dashboard" });
      setDashboards(prev => prev.map(d => d.id === id ? { ...d, name: name.trim() || "Untitled Dashboard" } : d));
    } catch (error) { reportError(error); }
  };
  const handleDeleteDashboard = async (id: string) => {
    if (dashboards.length <= 1) return;
    try {
      if (queue && !await queue.flush(id)) return;
      await deleteDashboard(id);
      const remaining = dashboards.filter(d => d.id !== id);
      setDashboards(remaining);
      if (activeId === id) handleSelectDashboard(remaining[0].id);
    } catch (error) { reportError(error); }
  };
  const handleToggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    void updateProfile(userId, { sidebar_collapsed: next }).catch(reportError);
  };
  const handleWidgetsChange = (widgets: WidgetConfig[]) => {
    if (!activeId || !queue) return;
    setDashboards(prev => prev.map(d => d.id === activeId ? { ...d, widgets } : d));
    writeStorage(`findash-draft-${userId}-${activeId}`, widgets);
    queue.schedule(activeId, widgets);
  };
  const retrySave = async () => {
    setSaveError(null);
    await queue?.flushAll();
  };
  const handleApiKeyCommit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === apiKey) { setDraftKey(apiKey); return; }
    try {
      await new ApiClient({ apiKey: trimmed }).getQuote("AAPL");
      await updateProfile(userId, { finnhub_key: trimmed });
      setApiKey(trimmed);
      setDraftKey(trimmed);
      setRefreshKey(k => k + 1);
    } catch (error) { setDraftKey(apiKey); reportError(error); }
  };
  const handleSignOut = async () => {
    try {
      if (queue && !await queue.flushAll()) {
        reportError(new Error("Your edits have not synced. Retry saving before signing out.")); return;
      }
      await auth.signOut();

      clearCache();
      router.replace("/login");
    } catch (error) { reportError(error); }
  };
  const handleStockSelect = (ticker: string) => {
    const widgets = dashboards.find(d => d.id === activeId)?.widgets ?? [];
    handleWidgetsChange([...widgets, { id: crypto.randomUUID(), type: "stock-quote",
      x: 0, y: Math.max(0, ...widgets.map(w => w.y + w.h)), w: 4, h: 5,
      minW: 3, minH: 4, settings: { ticker } }]);
  };


  if (loadError) return <AuthGate><main className="flex min-h-screen items-center justify-center p-6">
    <div className="max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8">
      <h1 className="text-xl font-semibold">Workspace unavailable</h1>
      <p role="alert" className="mt-3 text-sm text-[var(--accent-red)]">{loadError}</p>
      <button onClick={() => setLoadAttempt(n => n + 1)} className="mt-5 rounded-lg bg-[var(--accent-blue)] px-5 py-2 text-white">Retry</button>
      <button onClick={handleSignOut} className="ml-4 text-sm">Sign out</button>
    </div></main><ToastContainer /></AuthGate>;
  if (checking) return <AuthGate><div className="flex min-h-screen items-center justify-center gap-3">
    <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--border)] border-t-[var(--accent-blue)]" />
    <p>Loading your workspace…</p></div></AuthGate>;

  return <AuthGate><UserProvider key={userId} userId={userId} initialHoldings={initialHoldings}>
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Header apiKey={draftKey} validatedApiKey={apiKey} onApiKeyChange={setDraftKey}
        onApiKeyCommit={handleApiKeyCommit} onSignOut={handleSignOut}
        onToggleSidebar={handleToggleSidebar} sidebarCollapsed={sidebarCollapsed}
        onSearch={() => setSearchOpen(true)} onRefresh={refresh}
        onThemeChange={theme => { void updateProfile(userId, { theme }).catch(reportError); }} />
      <div className="flex flex-1">
        <div className="hidden md:block"><Sidebar dashboards={dashboards} activeDashboardId={activeId}
          collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} onSelect={handleSelectDashboard}
          onCreate={handleCreateDashboard} onRename={handleRenameDashboard} onDelete={handleDeleteDashboard} /></div>
        <main className="min-w-0 flex-1 overflow-x-hidden px-3 py-4 sm:px-4 pb-24">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><h1 className="text-lg font-semibold">{dashboards.find(d => d.id === activeId)?.name}</h1>
              <p className="text-xs text-[var(--text-secondary)]">Your markets, arranged your way.</p></div>
            <select aria-label="Choose dashboard" value={activeId} onChange={e => handleSelectDashboard(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 md:hidden">
              {dashboards.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <span role="status" className="text-xs text-[var(--text-muted)]">{saveError ? "Changes need syncing" : saving ? "Saving…" : "All changes saved"}</span>
          </div>
          {saveError && <div role="alert" className="mb-4 rounded-lg border border-[var(--accent-red)] p-3 text-sm">
            {saveError} <button onClick={retrySave} className="ml-3 underline">Retry save</button></div>}
          <DashboardGrid key={`${activeId}-${refreshKey}`} apiKey={apiKey}
            widgets={dashboards.find(d => d.id === activeId)?.widgets ?? []} onWidgetsChange={handleWidgetsChange} />
        </main>
      </div>
      <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleStockSelect} apiKey={apiKey} />
      <ToastContainer />
    </div>
  </UserProvider></AuthGate>;
}
