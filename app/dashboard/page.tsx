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
import { UserProvider } from "@/lib/UserContext";
import {
  getProfile,
  getUserDashboards,
  updateProfile,
  updateDashboard,
  createDashboard as createSupaDashboard,
  deleteDashboard as deleteSupaDashboard,
  seedDashboards,
  type UserProfile,
  type SupaDashboard,
} from "@/lib/supabaseData";
import { createSeedDashboards } from "@/lib/widgetConfig";
import type { WidgetConfig } from "@/lib/widgetConfig";

/* ------------------------------------------------------------------ */
/*  Dashboard type used in local state                                 */
/* ------------------------------------------------------------------ */
type Dashboard = {
  id: string;
  name: string;
  widgets: WidgetConfig[];
  position: number;
};

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */
export default function DashboardPage() {
  const router = useRouter();

  // Auth
  const [userId, setUserId] = useState("");
  const [checking, setChecking] = useState(true);

  // Profile / API key
  const [apiKey, setApiKey] = useState("");
  const [draftKey, setDraftKey] = useState("");

  // Multi-dashboard state
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [activeId, setActiveId] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Misc
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Debounce ref for widget saves
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Initialisation — load profile + dashboards from Supabase         */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      // 1. Get session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return; // AuthGate will redirect

      const uid = session.user.id;
      if (cancelled) return;
      setUserId(uid);

      // 2. Fetch profile
      let profile: UserProfile | null = null;
      try {
        profile = await getProfile(uid);
      } catch {
        /* table may not exist yet — will be caught below */
      }

      if (cancelled) return;

      // 3. If no profile or onboarding not completed → send to onboarding
      if (!profile || !profile.onboarding_completed || !profile.finnhub_key) {
        router.push("/onboarding");
        return;
      }

      setApiKey(profile.finnhub_key);
      setDraftKey(profile.finnhub_key);
      setSidebarCollapsed(profile.sidebar_collapsed);

      // 4. Fetch dashboards
      let boards: SupaDashboard[] = [];
      try {
        boards = await getUserDashboards(uid);
      } catch {
        /* will seed below */
      }

      if (cancelled) return;

      // 5. If user has no dashboards (edge case), seed them
      if (boards.length === 0) {
        try {
          const seeds = createSeedDashboards();
          boards = await seedDashboards(uid, seeds);
        } catch (err) {
          console.error("Failed to seed dashboards:", err);
        }
      }

      const localBoards: Dashboard[] = boards.map((b) => ({
        id: b.id,
        name: b.name,
        widgets: (b.widgets as WidgetConfig[]) || [],
        position: b.position,
      }));

      setDashboards(localBoards);

      // 6. Determine active dashboard
      let active = profile.active_dashboard_id || "";
      if (!active || !localBoards.find((b) => b.id === active)) {
        active = localBoards[0]?.id || "";
        if (active) {
          updateProfile(uid, { active_dashboard_id: active }).catch(() => {});
        }
      }
      setActiveId(active);

      setChecking(false);
    }

    init();
    return () => {
      cancelled = true;
    };
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
  /*  Dashboard CRUD (Supabase-backed)                                 */
  /* ---------------------------------------------------------------- */
  const handleSelectDashboard = useCallback(
    (id: string) => {
      setActiveId(id);
      if (userId) {
        updateProfile(userId, { active_dashboard_id: id }).catch(() => {});
      }
      setRefreshKey((p) => p + 1);
    },
    [userId]
  );

  const handleCreateDashboard = useCallback(
    async (name: string) => {
      if (!userId) return;
      try {
        const created = await createSupaDashboard(
          userId,
          name || "Untitled Dashboard",
          [],
          dashboards.length
        );
        const newBoard: Dashboard = {
          id: created.id,
          name: created.name,
          widgets: [],
          position: created.position,
        };
        setDashboards((prev) => [...prev, newBoard]);
        handleSelectDashboard(created.id);
      } catch (err) {
        console.error("Failed to create dashboard:", err);
      }
    },
    [userId, dashboards.length, handleSelectDashboard]
  );

  const handleRenameDashboard = useCallback(
    async (id: string, name: string) => {
      setDashboards((prev) =>
        prev.map((d) => (d.id === id ? { ...d, name } : d))
      );
      try {
        await updateDashboard(id, { name });
      } catch (err) {
        console.error("Failed to rename dashboard:", err);
      }
    },
    []
  );

  const handleDeleteDashboard = useCallback(
    async (id: string) => {
      if (dashboards.length <= 1) return;
      const updated = dashboards.filter((d) => d.id !== id);
      setDashboards(updated);

      if (activeId === id) {
        handleSelectDashboard(updated[0].id);
      }

      try {
        await deleteSupaDashboard(id);
      } catch (err) {
        console.error("Failed to delete dashboard:", err);
      }
    },
    [dashboards, activeId, handleSelectDashboard]
  );

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (userId) {
        updateProfile(userId, { sidebar_collapsed: next }).catch(() => {});
      }
      return next;
    });
  }, [userId]);

  /* ---------------------------------------------------------------- */
  /*  Widget changes — debounced save to Supabase                      */
  /* ---------------------------------------------------------------- */
  const handleWidgetsChange = useCallback(
    (widgets: WidgetConfig[]) => {
      setDashboards((prev) => {
        const updated = prev.map((d) =>
          d.id === activeId ? { ...d, widgets } : d
        );
        return updated;
      });

      // Debounce the Supabase write (widgets change frequently during drag)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        updateDashboard(activeId, { widgets }).catch((err) =>
          console.error("Failed to save widgets:", err)
        );
      }, 600);
    },
    [activeId]
  );

  /* ---------------------------------------------------------------- */
  /*  API key handlers — save to Supabase profile                      */
  /* ---------------------------------------------------------------- */
  const handleApiKeyDraftChange = useCallback((value: string) => {
    setDraftKey(value);
  }, []);

  const handleApiKeyCommit = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (trimmed && userId) {
        setApiKey(trimmed);
        setDraftKey(trimmed);
        try {
          await updateProfile(userId, { finnhub_key: trimmed });
        } catch (err) {
          console.error("Failed to save API key:", err);
        }
        setRefreshKey((p) => p + 1);
      }
    },
    [userId]
  );

  const handleThemeChange = useCallback(
    (theme: string) => {
      if (userId) {
        updateProfile(userId, { theme }).catch(() => {});
      }
    },
    [userId]
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // AuthGate will redirect to /login
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
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--bg-primary)]">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--border)] border-t-[var(--accent-blue)]" />
          <p className="text-sm text-[var(--text-secondary)]">
            Loading your workspace…
          </p>
        </div>
      </AuthGate>
    );
  }

  return (
    <AuthGate>
      <UserProvider userId={userId}>
        <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
          <Header
            apiKey={draftKey}
            onApiKeyChange={handleApiKeyDraftChange}
            onApiKeyCommit={handleApiKeyCommit}
            onSignOut={handleSignOut}
            onToggleSidebar={handleToggleSidebar}
            sidebarCollapsed={sidebarCollapsed}
            onThemeChange={handleThemeChange}
          />
          <div className="hidden flex-1 md:flex">
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
            <main className="w-full flex-1 overflow-x-hidden overflow-y-auto px-4 py-4">
              <DashboardGrid
                key={`${activeId}-${refreshKey}`}
                apiKey={apiKey}
                widgets={activeWidgets}
                onWidgetsChange={handleWidgetsChange}
                onStockSelect={handleStockSelect}
              />
            </main>
          </div>
          <main className="flex flex-1 items-center justify-center px-4 py-8 md:hidden">
            <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center shadow-lg">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Bigger screen recommended
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                FinDash dashboard editing works best on tablets and desktops.
                Please switch to a larger screen for the full experience.
              </p>
            </div>
          </main>
          <ToastContainer />
        </div>
      </UserProvider>
    </AuthGate>
  );
}
