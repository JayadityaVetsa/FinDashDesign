/** Explicit allow-list: never collect account routes or URL query/hash data. */
export function publicAnalyticsUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (!["/", "/demo", "/login", "/guides", "/guides/first-stock-watchlist", "/guides/portfolio-tracking-basics", "/privacy"].includes(url.pathname)) return null;
    url.search = ""; url.hash = "";
    return url.toString();
  } catch { return null; }
}
