import type { WidgetConfig } from "@/lib/widgetConfig";

/* ------------------------------------------------------------------ */
/*  Dashboard type                                                     */
/* ------------------------------------------------------------------ */

export type Dashboard = {
  id: string;
  name: string;
  widgets: WidgetConfig[];
  createdAt: number;
};

/* ------------------------------------------------------------------ */
/*  Storage keys                                                       */
/* ------------------------------------------------------------------ */

export const storageKeys = {
  alphaVantageKey: "findash-alpha-key", // Legacy, kept for migration
  finnhubKey: "findash-finnhub-key",
  gridLayout: "findash-grid-layout",
  portfolio: "findash-portfolio",
  widgetConfig: "findash-widget-config",
  layoutPreset: "findash-layout-preset",
  dashboards: "findash-dashboards",
  activeDashboard: "findash-active-dashboard",
};

/* ------------------------------------------------------------------ */
/*  Generic helpers                                                    */
/* ------------------------------------------------------------------ */

export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

/* ------------------------------------------------------------------ */
/*  Dashboard helpers                                                  */
/* ------------------------------------------------------------------ */

export function loadDashboards(): Dashboard[] {
  return readStorage<Dashboard[]>(storageKeys.dashboards, []);
}

export function saveDashboards(dashboards: Dashboard[]) {
  writeStorage(storageKeys.dashboards, dashboards);
}

export function getActiveDashboardId(): string {
  return readStorage<string>(storageKeys.activeDashboard, "");
}

export function setActiveDashboardId(id: string) {
  writeStorage(storageKeys.activeDashboard, id);
}
