import type { WidgetConfig } from "@/lib/widgetConfig";

/* ------------------------------------------------------------------ */
/*  Dashboard type (matches Supabase schema)                           */
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
/*  Generic localStorage helpers (theme only)                          */
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
