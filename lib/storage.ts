export const storageKeys = {
  alphaVantageKey: "findash-alpha-key", // Legacy, kept for migration
  finnhubKey: "findash-finnhub-key",
  gridLayout: "findash-grid-layout",
  portfolio: "findash-portfolio",
  widgetConfig: "findash-widget-config",
  layoutPreset: "findash-layout-preset",
};

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
