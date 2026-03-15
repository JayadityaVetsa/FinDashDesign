"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import DashboardGrid from "@/components/DashboardGrid";
import { defaultWidgets } from "@/components/DashboardGrid";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ToastContainer, { showRateLimitToast } from "@/components/Toast";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { setGlobalRateLimitHandler } from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";
import {
  readStorage,
  storageKeys,
  writeStorage,
  loadDashboards,
  saveDashboards,
  getActiveDashboardId,
  setActiveDashboardId,
  type Dashboard,
} from "@/lib/storage";
import { createSeedDashboards } from "@/lib/widgetConfig";
import type { WidgetConfig } from "@/lib/widgetConfig";

/* ------------------------------------------------------------------ */
/*  Helper: build a Dashboard object from seed data                    */
/* ------------------------------------------------------------------ */
function makeDashboard(name: string, widgets: WidgetConfig[]): Dashboard {
  return {
    id: crypto.randomUUID(),
    name,
    widgets,
    createdAt: Date.now(),
  };
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */
export default function DashboardPage() {
  const router = useRouter();

  // API key state
  const [apiKey, setApiKey] = useState("");
  const [draftKey, setDraftKey] = useState("");
  const [checking, setChecking] = useState(true);

  // Multi-dashboard state
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [activeId, setActiveId] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Misc
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  /* ---------------------------------------------------------------- */
  /*  Initialisation                                                   */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    // 1. Check API key
    const finnhubKey = readStorage<string>(storageKeys.finnhubKey, "");
    const alphaKey = readStorage<string>(storageKeys.alphaVantageKey, "");
    const key = finnhubKey || alphaKey;

    if (!key) {
      router.push("/onboarding");
      return;
    }

    setApiKey(key);
    setDraftKey(key);

    // 2. Load (or seed) dashboards
    let boards = loadDashboards();

    if (boards.length === 0) {
      // First visit — create seed dashboards
      const seeds = createSeedDashboards();
      boards = seeds.map((s) => makeDashboard(s.name, s.widgets));
      saveDashboards(boards);
    }

    setDashboards(boards);

    // 3. Determine active dashboard
    let savedActive = getActiveDashboardId();
    if (!savedActive || !boards.find((b) => b.id === savedActive)) {
      savedActive = boards[0].id;
      setActiveDashboardId(savedActive);
    }
    setActiveId(savedActive);

    // 4. Load sidebar collapsed state
    const collapsed = readStorage<boolean>("findash-sidebar-collapsed", false);
    setSidebarCollapsed(collapsed);

    setChecking(false);
  }, [router]);

  /* ---------------------------------------------------------------- */
  /*  Rate limit handler                                               */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    setGlobalRateLimitHandler((retryAfter) => {
      showRateLimitToast(retryAfter);
    });
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Keyboard shortcuts                                               */
  /* ---------------------------------------------------------------- */
  useKeyboardShortcuts([
    {
      key: "r",
      meta: true,
      handler: () => setRefreshKey((prev) => prev + 1),
    },
  ]);

  /* ---------------------------------------------------------------- */
  /*  Dashboard CRUD                                                   */
  /* ---------------------------------------------------------------- */
  const persist = useCallback((boards: Dashboard[]) => {
    setDashboards(boards);
    saveDashboards(boards);
  }, []);

  const handleSelectDashboard = useCallback(
    (id: string) => {
      setActiveId(id);
      setActiveDashboardId(id);
      setRefreshKey((p) => p + 1); // remount grid
    },
    []
  );

  const handleCreateDashboard = useCallback((name: string) => {
    const newBoard = makeDashboard(name || "Untitled Dashboard", []);
    const updated = [...dashboards, newBoard];
    persist(updated);
    handleSelectDashboard(newBoard.id);
  }, [dashboards, persist, handleSelectDashboard]);

  const handleRenameDashboard = useCallback(
    (id: string, name: string) => {
      const updated = dashboards.map((d) =>
        d.id === id ? { ...d, name } : d
      );
      persist(updated);
    },
    [dashboards, persist]
  );

  const handleDeleteDashboard = useCallback(
    (id: string) => {
      if (dashboards.length <= 1) return;
      const updated = dashboards.filter((d) => d.id !== id);
      persist(updated);

      // If we deleted the active one, switch to the first remaining
      if (activeId === id) {
        handleSelectDashboard(updated[0].id);
      }
    },
    [dashboards, activeId, persist, handleSelectDashboard]
  );

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      writeStorage("findash-sidebar-collapsed", next);
      return next;
    });
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Widget changes (from DashboardGrid)                              */
  /* ---------------------------------------------------------------- */
  const handleWidgetsChange = useCallback(
    (widgets: WidgetConfig[]) => {
      setDashboards((prev) => {
        const updated = prev.map((d) =>
          d.id === activeId ? { ...d, widgets } : d
        );
        saveDashboards(updated);
        return updated;
      });
    },
    [activeId]
  );

  /* ---------------------------------------------------------------- */
  /*  API key handlers                                                 */
  /* ---------------------------------------------------------------- */
  const handleApiKeyDraftChange = useCallback((value: string) => {
    setDraftKey(value);
  }, []);

  const handleApiKeyCommit = useCallback((value: string) => {
    const trimmed = value.trim();
    if (trimmed) {
      setApiKey(trimmed);
      setDraftKey(trimmed);
      writeStorage(storageKeys.finnhubKey, trimmed);
      setRefreshKey((p) => p + 1);
    }
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleStockSelect = (symbol: string) => {
    setSelectedStock(symbol);
  };

  /* ---------------------------------------------------------------- */
  /*  Derived: active dashboard's widgets                              */
  /* ---------------------------------------------------------------- */
  const activeDashboard = dashboards.find((d) => d.id === activeId);
  const activeWidgets = activeDashboard?.widgets ?? defaultWidgets;

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
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
          onToggleSidebar={handleToggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />
        <div className="flex flex-1">
          <Sidebar
            dashboards={dashboards}
            activeDashboardId={activeId}
            collapsed={sidebarCollapsed}
            onToggle={handleToggleSidebar}
            onSelect={handleSelectDashboard}
            onCreate={handleCreateDashboard}
            onRename={handleRenameDashboard}
            onDelete={handleDeleteDashboard}
          />
          <main className="mx-auto w-full max-w-[1920px] flex-1 px-4 py-4 overflow-x-hidden overflow-y-auto">
            <DashboardGrid
              key={`${activeId}-${refreshKey}`}
              apiKey={apiKey}
              widgets={activeWidgets}
              onWidgetsChange={handleWidgetsChange}
              onStockSelect={handleStockSelect}
            />
          </main>
        </div>
        <ToastContainer />
      </div>
    </AuthGate>
  );
}
