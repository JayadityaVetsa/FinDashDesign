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
  | "market-news";

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
      {
        type: "stock-quote",
        x: 0,
        y: 0,
        w: 4,
        h: 5,
        minW: 3,
        minH: 4,
        settings: { ticker: "AAPL" },
      },
      {
        type: "stock-quote",
        x: 4,
        y: 0,
        w: 4,
        h: 5,
        minW: 3,
        minH: 4,
        settings: { ticker: "MSFT" },
      },
      {
        type: "price-chart",
        x: 0,
        y: 5,
        w: 8,
        h: 7,
        minW: 4,
        minH: 5,
        settings: { ticker: "AAPL", timeRange: "1M" },
      },
      {
        type: "news-feed",
        x: 8,
        y: 0,
        w: 4,
        h: 12,
        minW: 3,
        minH: 5,
        settings: { ticker: "AAPL" },
      },
    ],
  },
  portfolio: {
    name: "Portfolio",
    description: "Manage many positions",
    widgets: [
      {
        type: "portfolio",
        x: 0,
        y: 0,
        w: 8,
        h: 8,
        minW: 4,
        minH: 4,
        settings: {},
      },
      {
        type: "market-overview",
        x: 8,
        y: 0,
        w: 4,
        h: 4,
        minW: 3,
        minH: 3,
        settings: {},
      },
      {
        type: "sector-heatmap",
        x: 8,
        y: 4,
        w: 4,
        h: 4,
        minW: 3,
        minH: 3,
        settings: {},
      },
    ],
  },
  trader: {
    name: "Trader",
    description: "Active, data-heavy",
    widgets: [
      {
        type: "price-chart",
        x: 0,
        y: 0,
        w: 8,
        h: 7,
        minW: 4,
        minH: 5,
        settings: { ticker: "AAPL", timeRange: "1D" },
      },
      {
        type: "watchlist",
        x: 8,
        y: 0,
        w: 4,
        h: 7,
        minW: 3,
        minH: 5,
        settings: { tickers: ["AAPL", "MSFT", "GOOGL", "AMZN"] },
      },
      {
        type: "earnings-calendar",
        x: 0,
        y: 7,
        w: 6,
        h: 5,
        minW: 4,
        minH: 4,
        settings: {},
      },
      {
        type: "technical-indicators",
        x: 6,
        y: 7,
        w: 6,
        h: 5,
        minW: 4,
        minH: 4,
        settings: { ticker: "AAPL" },
      },
    ],
  },
};

export const WIDGET_DEFINITIONS: Record<
  WidgetType,
  { name: string; description: string; icon: string }
> = {
  "stock-quote": {
    name: "Stock Quote",
    description: "Real-time price and key metrics",
    icon: "📊",
  },
  "price-chart": {
    name: "Price Chart",
    description: "Historical price with volume",
    icon: "📈",
  },
  "news-feed": {
    name: "News Feed",
    description: "Company-specific news",
    icon: "📰",
  },
  portfolio: {
    name: "Portfolio",
    description: "Track your holdings",
    icon: "💼",
  },
  "market-overview": {
    name: "Market Overview",
    description: "Major indices performance",
    icon: "🌐",
  },
  "sector-heatmap": {
    name: "Sector Heatmap",
    description: "Sector ETF performance",
    icon: "🔥",
  },
  "earnings-calendar": {
    name: "Earnings Calendar",
    description: "Upcoming earnings",
    icon: "📅",
  },
  watchlist: {
    name: "Watchlist",
    description: "Custom ticker list",
    icon: "⭐",
  },
  "technical-indicators": {
    name: "Technical Indicators",
    description: "Financial metrics",
    icon: "🔢",
  },
  "market-news": {
    name: "Market News",
    description: "General market news",
    icon: "📰",
  },
};
