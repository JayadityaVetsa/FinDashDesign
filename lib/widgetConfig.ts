export type WidgetType =
  | "stock-quote"
  | "price-chart"
  | "news-feed"
  | "portfolio"
  | "market-overview"
  | "sector-heatmap"
  | "earnings-calendar"
  | "watchlist"
  | "technical-indicators"
  | "market-news"
  | "crypto-tracker"
  | "company-profile"
  | "forex-rates"
  | "ipo-calendar"
  | "insider-sentiment";

export type WidgetConfig = {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  settings: Record<string, unknown>; // Widget-specific settings (e.g., ticker, time range)
};

export type WidgetPreset = {
  name: string;
  description: string;
  widgets: Omit<WidgetConfig, "id">[];
};

export const WIDGET_PRESETS: Record<string, WidgetPreset> = {
  focused: {
    name: "Focused",
    description: "Track a few stocks closely",
    widgets: [
      { type: "stock-quote", x: 0, y: 0, w: 4, h: 5, minW: 3, minH: 4, settings: { ticker: "AAPL" } },
      { type: "stock-quote", x: 4, y: 0, w: 4, h: 5, minW: 3, minH: 4, settings: { ticker: "MSFT" } },
      { type: "company-profile", x: 8, y: 0, w: 4, h: 7, minW: 3, minH: 5, settings: { ticker: "AAPL" } },
      { type: "news-feed", x: 0, y: 5, w: 4, h: 8, minW: 3, minH: 5, settings: { ticker: "AAPL" } },
      { type: "watchlist", x: 4, y: 5, w: 4, h: 7, minW: 3, minH: 5, settings: { tickers: ["AAPL", "MSFT", "GOOGL"] } },
      { type: "technical-indicators", x: 8, y: 7, w: 4, h: 5, minW: 3, minH: 4, settings: { ticker: "AAPL" } },
    ],
  },
  portfolio: {
    name: "Portfolio",
    description: "Manage many positions",
    widgets: [
      { type: "portfolio", x: 0, y: 0, w: 8, h: 10, minW: 4, minH: 6, settings: {} },
      { type: "market-overview", x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3, settings: {} },
      { type: "sector-heatmap", x: 8, y: 4, w: 4, h: 5, minW: 3, minH: 3, settings: {} },
    ],
  },
  trader: {
    name: "Trader",
    description: "Active, data-heavy",
    widgets: [
      { type: "watchlist", x: 0, y: 0, w: 6, h: 7, minW: 3, minH: 5, settings: { tickers: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA"] } },
      { type: "stock-quote", x: 6, y: 0, w: 3, h: 5, minW: 3, minH: 4, settings: { ticker: "AAPL" } },
      { type: "stock-quote", x: 9, y: 0, w: 3, h: 5, minW: 3, minH: 4, settings: { ticker: "TSLA" } },
      { type: "earnings-calendar", x: 0, y: 7, w: 6, h: 5, minW: 4, minH: 4, settings: {} },
      { type: "technical-indicators", x: 6, y: 5, w: 6, h: 5, minW: 3, minH: 4, settings: { ticker: "AAPL" } },
      { type: "market-news", x: 6, y: 10, w: 6, h: 8, minW: 3, minH: 5, settings: {} },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Seed dashboard definitions (used on first visit)                   */
/* ------------------------------------------------------------------ */

export type SeedDashboard = {
  name: string;
  widgets: WidgetConfig[];
};

function stamp(widgets: Omit<WidgetConfig, "id">[]): WidgetConfig[] {
  const ts = Date.now();
  return widgets.map((w, i) => ({ ...w, id: `${w.type}-${ts}-${i}` }));
}

export function createSeedDashboards(): SeedDashboard[] {
  return [
    {
      name: "Overview",
      widgets: stamp([
        { type: "stock-quote", x: 0, y: 0, w: 4, h: 5, minW: 3, minH: 4, settings: { ticker: "AAPL" } },
        { type: "stock-quote", x: 4, y: 0, w: 4, h: 5, minW: 3, minH: 4, settings: { ticker: "MSFT" } },
        { type: "market-overview", x: 8, y: 0, w: 4, h: 5, minW: 3, minH: 4, settings: {} },
        { type: "watchlist", x: 0, y: 5, w: 4, h: 7, minW: 3, minH: 5, settings: { tickers: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA"] } },
        { type: "sector-heatmap", x: 4, y: 5, w: 4, h: 5, minW: 3, minH: 4, settings: {} },
        { type: "technical-indicators", x: 8, y: 5, w: 4, h: 5, minW: 3, minH: 4, settings: { ticker: "AAPL" } },
        { type: "market-news", x: 0, y: 12, w: 6, h: 8, minW: 3, minH: 5, settings: {} },
        { type: "earnings-calendar", x: 6, y: 12, w: 6, h: 5, minW: 4, minH: 4, settings: {} },
      ]),
    },
    {
      name: "My Portfolio",
      widgets: stamp([
        { type: "portfolio", x: 0, y: 0, w: 8, h: 10, minW: 4, minH: 6, settings: {} },
        { type: "sector-heatmap", x: 8, y: 0, w: 4, h: 5, minW: 3, minH: 4, settings: {} },
        { type: "technical-indicators", x: 8, y: 5, w: 4, h: 5, minW: 3, minH: 4, settings: { ticker: "AAPL" } },
      ]),
    },
    {
      name: "News Center",
      widgets: stamp([
        { type: "market-news", x: 0, y: 0, w: 6, h: 10, minW: 3, minH: 5, settings: {} },
        { type: "news-feed", x: 6, y: 0, w: 6, h: 8, minW: 3, minH: 5, settings: { ticker: "AAPL" } },
        { type: "news-feed", x: 0, y: 10, w: 6, h: 8, minW: 3, minH: 5, settings: { ticker: "MSFT" } },
        { type: "news-feed", x: 6, y: 8, w: 6, h: 8, minW: 3, minH: 5, settings: { ticker: "GOOGL" } },
      ]),
    },
    {
      name: "Crypto & Forex",
      widgets: stamp([
        { type: "crypto-tracker", x: 0, y: 0, w: 6, h: 8, minW: 3, minH: 5, settings: {} },
        { type: "forex-rates", x: 6, y: 0, w: 6, h: 8, minW: 3, minH: 5, settings: {} },
        { type: "market-news", x: 0, y: 8, w: 12, h: 8, minW: 3, minH: 5, settings: { category: "crypto" } },
      ]),
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Widget definitions (for Add Widget modal)                          */
/* ------------------------------------------------------------------ */

export const WIDGET_DEFINITIONS: Record<
  WidgetType,
  { name: string; description: string; icon: string; tag?: string }
> = {
  "stock-quote": {
    name: "Stock Quote",
    description: "Real-time price, change, and sparkline for any stock",
    icon: "📊",
  },
  "price-chart": {
    name: "Price Chart",
    description: "Historical price with volume (requires paid API)",
    icon: "📈",
    tag: "Premium",
  },
  "news-feed": {
    name: "Company News",
    description: "News feed for a specific stock ticker",
    icon: "📰",
  },
  portfolio: {
    name: "Portfolio Tracker",
    description: "Track your stock holdings, P&L, and allocation",
    icon: "💼",
  },
  "market-overview": {
    name: "Market Overview",
    description: "S&P 500, NASDAQ, DOW, Russell 2000 at a glance",
    icon: "🌐",
  },
  "sector-heatmap": {
    name: "Sector Heatmap",
    description: "Visual sector performance (Tech, Finance, Energy, etc.)",
    icon: "🔥",
  },
  "earnings-calendar": {
    name: "Earnings Calendar",
    description: "Upcoming earnings reports this week",
    icon: "📅",
  },
  watchlist: {
    name: "Watchlist",
    description: "Custom ticker list with sortable columns",
    icon: "⭐",
  },
  "technical-indicators": {
    name: "Technical Indicators",
    description: "P/E, EPS, beta, 52W range, market cap for any stock",
    icon: "🔢",
  },
  "market-news": {
    name: "Market News",
    description: "General, crypto, forex, or merger news",
    icon: "🗞️",
  },
  "crypto-tracker": {
    name: "Crypto Tracker",
    description: "Track BTC, ETH, SOL and other crypto prices live",
    icon: "₿",
    tag: "New",
  },
  "company-profile": {
    name: "Company Profile",
    description: "Company info, logo, market cap, industry, and links",
    icon: "🏢",
    tag: "New",
  },
  "forex-rates": {
    name: "Forex Rates",
    description: "Live currency exchange rates with base selector",
    icon: "💱",
    tag: "New",
  },
  "ipo-calendar": {
    name: "IPO Calendar",
    description: "Upcoming IPOs in the next 30 days",
    icon: "🚀",
    tag: "New",
  },
  "insider-sentiment": {
    name: "Insider Sentiment",
    description: "Monthly insider buy/sell ratio chart for any stock",
    icon: "🕵️",
    tag: "New",
  },
};
