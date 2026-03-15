type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
};

const CACHE_PREFIX = "findash-cache-";

export function getCacheKey(endpoint: string, params: Record<string, string>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return `${CACHE_PREFIX}${endpoint}?${sortedParams}`;
}

export function getCached<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      window.localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T, ttl: number): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    // localStorage might be full, silently fail
    console.warn("Failed to cache data:", error);
  }
}

export function clearCache(pattern?: string): void {
  if (typeof window === "undefined") return;
  try {
    const keys = Object.keys(window.localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        if (!pattern || key.includes(pattern)) {
          window.localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.warn("Failed to clear cache:", error);
  }
}

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  QUOTE: 60 * 1000, // 60 seconds
  NEWS: 5 * 60 * 1000, // 5 minutes
  CANDLE: 60 * 60 * 1000, // 1 hour
  PROFILE: 24 * 60 * 60 * 1000, // 24 hours
  METRICS: 24 * 60 * 60 * 1000, // 24 hours
  MARKET_NEWS: 5 * 60 * 1000, // 5 minutes
  EARNINGS: 60 * 60 * 1000, // 1 hour
  SEARCH: 10 * 60 * 1000, // 10 minutes
} as const;
