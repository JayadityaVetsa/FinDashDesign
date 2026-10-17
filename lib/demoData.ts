import type { Holding } from "./models";
import { WIDGET_DEFINITIONS, type WidgetConfig } from "./widgetConfig";
// Invented, deterministic fixtures. These are never fetched from a provider
// and must only be used under the explicitly labeled demo UI.
const sampleTime = Date.UTC(2026, 9, 1, 16) / 1000;
const names: Record<string, string> = { AAPL: "Apple", MSFT: "Microsoft", GOOGL: "Alphabet", NVDA: "NVIDIA", AMZN: "Amazon", TSLA: "Tesla", SPY: "S&P 500 ETF", QQQ: "Nasdaq ETF", DIA: "Dow ETF", IWM: "Russell 2000 ETF" };
export const DEMO_HOLDINGS: Holding[] = [
  { id: "sample-aapl", ticker: "AAPL", quantity: 5, avgCost: 100 },
  { id: "sample-msft", ticker: "MSFT", quantity: 3, avgCost: 150 },
];
export function isDemoLayout(value: unknown): value is WidgetConfig[] {
  if (!Array.isArray(value) || value.length > 100) return false;
  const ids = new Set<string>();
  return value.every(w => {
    if (!w || typeof w !== "object" || typeof w.id !== "string" || ids.has(w.id) || !Object.hasOwn(WIDGET_DEFINITIONS, w.type)) return false;
    ids.add(w.id);
    return ["x", "y", "w", "h"].every(field => Number.isInteger(w[field]) && w[field] >= (field === "w" || field === "h" ? 1 : 0) && w[field] <= 10000)
      && w.settings && typeof w.settings === "object" && !Array.isArray(w.settings);
  });
}
export function demoWidgets(): WidgetConfig[] {
  return [
    { id: "demo-watchlist", type: "watchlist", x: 0, y: 0, w: 4, h: 7, settings: { tickers: ["AAPL", "MSFT", "GOOGL", "NVDA"] } },
    { id: "demo-chart", type: "price-chart", x: 4, y: 0, w: 8, h: 7, settings: { ticker: "AAPL", timeRange: "1M" } },
    { id: "demo-portfolio", type: "portfolio", x: 0, y: 7, w: 8, h: 10, settings: {} },
    { id: "demo-quote", type: "stock-quote", x: 8, y: 7, w: 4, h: 5, settings: { ticker: "MSFT" } },
    { id: "demo-news", type: "news-feed", x: 8, y: 12, w: 4, h: 7, settings: { ticker: "AAPL" } },
  ];
}
export function demoResponse(endpoint: string, params: Record<string, string>): unknown {
  const symbol = params.symbol || "AAPL";
  const seed = [...symbol].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const price = 90 + seed % 240;
  if (endpoint === "/quote") {
    const change = (seed % 9 - 3) * 0.8;
    return { c: price, d: change, dp: change / (price - change) * 100, h: price + 3, l: price - 4, o: price - change, pc: price - change, t: sampleTime };
  }
  if (endpoint.endsWith("/candle")) {
    const to = Number(params.to) || sampleTime;
    const from = Number(params.from) || to - 30 * 86400;
    const t = Array.from({ length: 40 }, (_, i) => Math.round(from + (to - from) * i / 39));
    const c = t.map((_, i) => Number((price - 10 + i * 0.25 + Math.sin(i * 0.7) * 3).toFixed(2)));
    return { s: "ok", t, c, o: c.map(v => v - 0.5), h: c.map(v => v + 1), l: c.map(v => v - 1), v: c.map((_, i) => 1000000 + i * 170000) };
  }
  if (endpoint === "/search") {
    const q = (params.q || "").toLowerCase();
    return Object.entries(names).filter(([ticker, name]) => `${ticker} ${name}`.toLowerCase().includes(q))
      .map(([ticker, name]) => ({ symbol: ticker, displaySymbol: ticker, description: `${name} — sample data`, type: "Sample" }));
  }
  if (endpoint === "/stock/profile2") return { ticker: symbol, name: `${names[symbol] || symbol} (sample)`, country: "US", currency: "USD", exchange: "Illustrative exchange", finnhubIndustry: "Sample industry", ipo: "2000-01-01", logo: "", marketCapitalization: 100000, phone: "", shareOutstanding: 1000, weburl: "/guides/first-stock-watchlist" };
  if (endpoint === "/stock/metric") return { symbol, series: {}, metric: { "52WeekHigh": price + 40, "52WeekLow": price - 50, "52WeekLowDate": "2025-10-01", "52WeekPriceReturnDaily": 5, beta: 1.1, dividendYieldIndicatedAnnual: 0.5, epsAnnual: 5, marketCapitalization: 100000, peAnnual: 25, priceToBookAnnual: 4, priceToSalesAnnual: 6 } };
  if (endpoint === "/news" || endpoint === "/company-news") return [
    { id: 1, category: "sample", datetime: sampleTime, headline: "Sample: build a watchlist before adding more widgets", summary: "This is an illustrative news card, not a real company announcement. Open the beginner guide to learn the workflow.", source: "FinDash demo", related: symbol, image: "", url: "/guides/first-stock-watchlist" },
    { id: 2, category: "sample", datetime: sampleTime, headline: "Sample: understand the numbers in your portfolio", summary: "Try changing a sample holding’s quantity and average cost. No trades are placed and no brokerage account is connected.", source: "FinDash demo", related: symbol, image: "", url: "/guides/portfolio-tracking-basics" },
  ];
  if (endpoint === "/forex/rates") {
    const usd: Record<string, number> = { USD: 1, EUR: 0.9, GBP: 0.8, JPY: 140, CAD: 1.3, AUD: 1.5, CHF: 0.9, CNY: 7, INR: 80 };
    const base = params.base || "USD";
    return { base, quote: Object.fromEntries(Object.entries(usd).map(([key, value]) => [key, value / (usd[base] || 1)])) };
  }
  if (endpoint === "/stock/insider-sentiment") return Array.from({ length: 6 }, (_, i) => ({ symbol, year: 2026, month: i + 1, change: (i - 2) * 100, mspr: Math.sin(i) * 40 }));
  // Calendar widgets truthfully display an empty sample state.
  if (endpoint === "/calendar/earnings" || endpoint === "/calendar/ipo") return [];
  throw new Error("This widget is not included in the sample dataset.");
}
