"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
type LayoutItem = {
  readonly i: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly minW?: number;
  readonly minH?: number;
};
type Layouts = { [P: string]: LayoutItem[] };
import { Plus } from "lucide-react";
import { type WidgetConfig, type WidgetType } from "@/lib/widgetConfig";
import AddWidgetModal from "@/components/AddWidgetModal";
import WidgetBase from "@/components/widgets/WidgetBase";
// Widgets
import StockQuoteCard from "@/components/widgets/StockQuoteCard";
import PriceChart from "@/components/widgets/PriceChart";
import NewsFeed from "@/components/widgets/NewsFeed";
import PortfolioTracker from "@/components/widgets/PortfolioTracker";
import MarketOverview from "@/components/widgets/MarketOverview";
import SectorHeatmap from "@/components/widgets/SectorHeatmap";
import EarningsCalendar from "@/components/widgets/EarningsCalendar";
import Watchlist from "@/components/widgets/Watchlist";
import TechnicalIndicators from "@/components/widgets/TechnicalIndicators";
import MarketNewsFeed from "@/components/widgets/MarketNewsFeed";
import CryptoTracker from "@/components/widgets/CryptoTracker";
import CompanyProfile from "@/components/widgets/CompanyProfile";
import ForexRates from "@/components/widgets/ForexRates";
import IPOCalendar from "@/components/widgets/IPOCalendar";
import InsiderSentiment from "@/components/widgets/InsiderSentiment";

const ResponsiveGridLayout = WidthProvider(Responsive);

// Default sizing per widget type — min sizes prevent unreadable widgets
const WIDGET_DEFAULTS: Record<WidgetType, { w: number; h: number; minW: number; minH: number }> = {
  "stock-quote":          { w: 4, h: 5,  minW: 3, minH: 4 },
  "price-chart":          { w: 8, h: 7,  minW: 4, minH: 5 },
  "news-feed":            { w: 4, h: 8,  minW: 3, minH: 5 },
  portfolio:              { w: 8, h: 10, minW: 4, minH: 6 },
  "market-overview":      { w: 4, h: 5,  minW: 3, minH: 4 },
  "sector-heatmap":       { w: 4, h: 5,  minW: 3, minH: 4 },
  "earnings-calendar":    { w: 6, h: 5,  minW: 4, minH: 4 },
  watchlist:              { w: 4, h: 7,  minW: 3, minH: 5 },
  "technical-indicators": { w: 4, h: 5,  minW: 3, minH: 4 },
  "market-news":          { w: 4, h: 8,  minW: 3, minH: 5 },
  "crypto-tracker":       { w: 4, h: 7,  minW: 3, minH: 5 },
  "company-profile":      { w: 4, h: 7,  minW: 3, minH: 5 },
  "forex-rates":          { w: 4, h: 7,  minW: 3, minH: 5 },
  "ipo-calendar":         { w: 4, h: 6,  minW: 3, minH: 4 },
  "insider-sentiment":    { w: 6, h: 6,  minW: 4, minH: 5 },
};

// Default widget settings per type
function getDefaultSettings(type: WidgetType): Record<string, unknown> {
  switch (type) {
    case "stock-quote":          return { ticker: "AAPL" };
    case "price-chart":          return { ticker: "MSFT", timeRange: "1M" };
    case "news-feed":            return { ticker: "AAPL" };
    case "watchlist":            return { tickers: ["AAPL", "MSFT", "GOOGL"] };
    case "technical-indicators": return { ticker: "AAPL" };
    case "company-profile":      return { ticker: "AAPL" };
    case "insider-sentiment":    return { ticker: "AAPL" };
    default:                     return {};
  }
}

// Default widgets — balanced layout optimised for Finnhub free tier (no price-chart)
export const defaultWidgets: WidgetConfig[] = [
  { id: "stock-quote-1", type: "stock-quote", x: 0, y: 0, w: 4, h: 5, minW: 3, minH: 4, settings: { ticker: "AAPL" } },
  { id: "stock-quote-2", type: "stock-quote", x: 4, y: 0, w: 4, h: 5, minW: 3, minH: 4, settings: { ticker: "MSFT" } },
  { id: "market-overview-1", type: "market-overview", x: 8, y: 0, w: 4, h: 5, minW: 3, minH: 4, settings: {} },
  { id: "watchlist-1", type: "watchlist", x: 0, y: 5, w: 4, h: 7, minW: 3, minH: 5, settings: { tickers: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA"] } },
  { id: "sector-heatmap-1", type: "sector-heatmap", x: 4, y: 5, w: 4, h: 5, minW: 3, minH: 4, settings: {} },
  { id: "technical-1", type: "technical-indicators", x: 8, y: 5, w: 4, h: 5, minW: 3, minH: 4, settings: { ticker: "AAPL" } },
  { id: "portfolio-1", type: "portfolio", x: 0, y: 12, w: 8, h: 10, minW: 4, minH: 6, settings: {} },
  { id: "market-news-1", type: "market-news", x: 8, y: 10, w: 4, h: 10, minW: 3, minH: 5, settings: {} },
];

// Convert widget configs to react-grid-layout format
function configsToLayouts(widgets: WidgetConfig[]): Layouts {
  const layouts: Layouts = { lg: [], md: [], sm: [] };
  
  widgets.forEach((widget) => {
    const defaults = WIDGET_DEFAULTS[widget.type] || { w: 4, h: 5, minW: 3, minH: 4 };
    const layoutItem: LayoutItem = {
      i: widget.id,
      x: widget.x,
      y: widget.y,
      w: widget.w || defaults.w,
      h: widget.h || defaults.h,
      minW: widget.minW || defaults.minW,
      minH: widget.minH || defaults.minH,
    };
    layouts.lg!.push({ ...layoutItem });
    layouts.md!.push({ ...layoutItem, w: Math.min(layoutItem.w, 10) });
    layouts.sm!.push({ ...layoutItem, w: Math.min(layoutItem.w, 6), x: 0 });
  });
  
  return layouts;
}

type DashboardGridProps = {
  apiKey: string;
  widgets: WidgetConfig[];
  onWidgetsChange: (widgets: WidgetConfig[]) => void;
  onStockSelect?: (symbol: string) => void;
};

export default function DashboardGrid({
  apiKey,
  widgets,
  onWidgetsChange,
  onStockSelect,
}: DashboardGridProps) {
  const [mounted, setMounted] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Use a ref to track widgets for the drag/resize callbacks
  const widgetsRef = useRef<WidgetConfig[]>(widgets);

  // Keep ref in sync
  useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);

  // Delay mount to let layout settle
  useEffect(() => {
    setMounted(false);
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const layouts = useMemo(() => configsToLayouts(widgets), [widgets]);

  const saveCurrentLayout = useCallback((newLayout: readonly LayoutItem[]) => {
    const currentWidgets = widgetsRef.current;
    const configMap = new Map(currentWidgets.map((w) => [w.id, w]));
    const updated: WidgetConfig[] = [];

    newLayout.forEach((layout) => {
      const config = configMap.get(layout.i);
      if (config) {
        const defaults = WIDGET_DEFAULTS[config.type] || { w: 4, h: 5, minW: 3, minH: 4 };
        updated.push({
          ...config,
          x: layout.x,
          y: layout.y,
          w: layout.w,
          h: layout.h,
          minW: config.minW || defaults.minW,
          minH: config.minH || defaults.minH,
        });
      }
    });

    if (updated.length === currentWidgets.length) {
      onWidgetsChange(updated);
    }
  }, [onWidgetsChange]);

  const handleDragStop = useCallback(
    (layout: readonly LayoutItem[]) => saveCurrentLayout(layout),
    [saveCurrentLayout]
  );

  const handleResizeStop = useCallback(
    (layout: readonly LayoutItem[]) => saveCurrentLayout(layout),
    [saveCurrentLayout]
  );

  const handleAddWidget = useCallback((type: WidgetType) => {
    const defaults = WIDGET_DEFAULTS[type] || { w: 4, h: 5, minW: 3, minH: 4 };
    const settings = getDefaultSettings(type);
    const currentWidgets = widgetsRef.current;
    const maxY = currentWidgets.length > 0 ? Math.max(...currentWidgets.map((w) => w.y + w.h)) : 0;
    
    const newWidget: WidgetConfig = {
      id: `${type}-${Date.now()}`,
      type,
      x: 0,
      y: maxY,
      ...defaults,
      settings,
    };
    
    onWidgetsChange([...currentWidgets, newWidget]);
  }, [onWidgetsChange]);

  const handleRemoveWidget = useCallback((id: string) => {
    const currentWidgets = widgetsRef.current;
    onWidgetsChange(currentWidgets.filter((w) => w.id !== id));
  }, [onWidgetsChange]);

  const handleUpdateWidgetSettings = useCallback(
    (id: string, newSettings: Record<string, unknown>) => {
      const currentWidgets = widgetsRef.current;
      onWidgetsChange(
        currentWidgets.map((w) =>
          w.id === id ? { ...w, settings: { ...w.settings, ...newSettings } } : w
        )
      );
    },
    [onWidgetsChange]
  );

  const renderWidget = (config: WidgetConfig) => {
    const commonProps = { apiKey };
    const onClose = () => handleRemoveWidget(config.id);
    
    switch (config.type) {
      case "stock-quote":
        return (
          <StockQuoteCard
            {...commonProps}
            ticker={(config.settings.ticker as string) || "AAPL"}
            onClose={onClose}
            onTickerChange={(ticker) => handleUpdateWidgetSettings(config.id, { ticker })}
          />
        );
      case "price-chart":
        return (
          <PriceChart
            {...commonProps}
            ticker={(config.settings.ticker as string) || "AAPL"}
            timeRange={(config.settings.timeRange as string) || "1M"}
            onClose={onClose}
          />
        );
      case "news-feed":
        return (
          <NewsFeed
            {...commonProps}
            ticker={(config.settings.ticker as string) || "AAPL"}
            onClose={onClose}
            onTickerChange={(ticker) => handleUpdateWidgetSettings(config.id, { ticker })}
          />
        );
      case "portfolio":
        return <PortfolioTracker {...commonProps} onClose={onClose} />;
      case "market-overview":
        return <MarketOverview {...commonProps} onClose={onClose} />;
      case "sector-heatmap":
        return <SectorHeatmap {...commonProps} onClose={onClose} />;
      case "earnings-calendar":
        return <EarningsCalendar {...commonProps} onClose={onClose} />;
      case "watchlist":
        return (
          <Watchlist
            {...commonProps}
            tickers={(config.settings.tickers as string[]) || ["AAPL", "MSFT", "GOOGL"]}
            onClose={onClose}
          />
        );
      case "technical-indicators":
        return (
          <TechnicalIndicators
            {...commonProps}
            ticker={(config.settings.ticker as string) || "AAPL"}
            onClose={onClose}
          />
        );
      case "market-news":
        return <MarketNewsFeed {...commonProps} onClose={onClose} />;
      case "crypto-tracker":
        return <CryptoTracker {...commonProps} onClose={onClose} />;
      case "company-profile":
        return (
          <CompanyProfile
            {...commonProps}
            ticker={(config.settings.ticker as string) || "AAPL"}
            onClose={onClose}
            onTickerChange={(ticker) => handleUpdateWidgetSettings(config.id, { ticker })}
          />
        );
      case "forex-rates":
        return <ForexRates {...commonProps} onClose={onClose} />;
      case "ipo-calendar":
        return <IPOCalendar {...commonProps} onClose={onClose} />;
      case "insider-sentiment":
        return (
          <InsiderSentiment
            {...commonProps}
            ticker={(config.settings.ticker as string) || "AAPL"}
            onClose={onClose}
            onTickerChange={(ticker) => handleUpdateWidgetSettings(config.id, { ticker })}
          />
        );
      default:
        return (
          <WidgetBase
            title={config.type}
            onClose={onClose}
          >
            <div className="text-sm text-[var(--text-secondary)]">
              Widget &quot;{config.type}&quot; coming soon
            </div>
          </WidgetBase>
        );
    }
  };

  if (!mounted) return null;

  return (
    <>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 900, sm: 600, xs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 2 }}
        rowHeight={40}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        draggableHandle=".widget-handle"
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        isResizable
        isDraggable
        compactType="vertical"
        useCSSTransforms
      >
        {widgets.map((widget) => (
          <div key={widget.id} className="h-full">
            {renderWidget(widget)}
          </div>
        ))}
      </ResponsiveGridLayout>

      {/* Add Widget Button */}
      <button
        onClick={() => setAddModalOpen(true)}
        className="fixed bottom-6 right-6 flex h-12 items-center gap-2 rounded-full bg-[var(--accent-blue)] px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl z-50"
      >
        <Plus className="h-5 w-5" />
        <span>Add Widget</span>
      </button>

      <AddWidgetModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddWidget}
      />
    </>
  );
}
