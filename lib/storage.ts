import type { WidgetConfig } from "@/lib/widgetConfig";

/* ------------------------------------------------------------------ */
/*  Dashboard type (shared by the dashboard UI)                           */
/* ------------------------------------------------------------------ */

export type Dashboard = {
  id: string;
  name: string;
  widgets: WidgetConfig[];
  position: number;
};

/* ------------------------------------------------------------------ */
/*  Storage keys — used only for theme (pre-hydration) now             */
/* ------------------------------------------------------------------ */

export const storageKeys = {
  theme: "findash-theme",
};

/* ------------------------------------------------------------------ */
/*  Generic localStorage helpers (recoverable pending edits)                          */
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
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage may be disabled or full. */ }
}
