"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import type { Layouts, Layout } from "react-grid-layout";
import { Plus } from "lucide-react";
import { readStorage, storageKeys, writeStorage } from "@/lib/storage";
import { type WidgetConfig, type WidgetType, WIDGET_PRESETS } from "@/lib/widgetConfig";
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

const ResponsiveGridLayout = WidthProvider(Responsive);

const LAYOUT_VERSION = 8; // Bump to force fresh layout

// Default sizing per widget type
const WIDGET_DEFAULTS: Record<WidgetType, { w: number; h: number; minW: number; minH: number }> = {
  "stock-quote": { w: 4, h: 5, minW: 3, minH: 4 },
  "price-chart": { w: 8, h: 7, minW: 4, minH: 5 },
  "news-feed": { w: 4, h: 8, minW: 3, minH: 5 },
  portfolio: { w: 6, h: 8, minW: 4, minH: 5 },
  "market-overview": { w: 4, h: 4, minW: 3, minH: 3 },
  "sector-heatmap": { w: 4, h: 4, minW: 3, minH: 3 },
  "earnings-calendar": { w: 6, h: 5, minW: 4, minH: 4 },
  watchlist: { w: 4, h: 7, minW: 3, minH: 5 },
  "technical-indicators": { w: 6, h: 5, minW: 4, minH: 4 },
  "market-news": { w: 4, h: 8, minW: 3, minH: 5 },
};

// Default widget settings per type
function getDefaultSettings(type: WidgetType): Record<string, unknown> {
  switch (type) {
    case "stock-quote": return { ticker: "AAPL" };
    case "price-chart": return { ticker: "MSFT", timeRange: "1M" };
    case "news-feed": return { ticker: "AAPL" };
    case "watchlist": return { tickers: ["AAPL", "MSFT", "GOOGL"] };
    case "technical-indicators": return { ticker: "AAPL" };
    default: return {};
  }
}

// Convert widget configs to react-grid-layout format
function configsToLayouts(widgets: WidgetConfig[]): Layouts {
  const layouts: Layouts = { lg: [], md: [], sm: [] };
  
  widgets.forEach((widget) => {
    const defaults = WIDGET_DEFAULTS[widget.type] || { w: 4, h: 5, minW: 3, minH: 4 };
    const layoutItem: Layout = {
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

// Default widgets — balanced layout optimised for Finnhub free tier
const defaultWidgets: WidgetConfig[] = [
  {
    id: "stock-price-1",
    type: "stock-quote",
    x: 0, y: 0,
    w: 4, h: 5, minW: 3, minH: 4,
    settings: { ticker: "AAPL" },
  },
  {
    id: "watchlist-1",
    type: "watchlist",
    x: 4, y: 0,
    w: 4, h: 7, minW: 3, minH: 5,
    settings: { tickers: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA"] },
  },
  {
    id: "portfolio-1",
    type: "portfolio",
    x: 8, y: 0,
    w: 4, h: 8, minW: 4, minH: 5,
    settings: {},
  },
  {
    id: "news-feed-1",
    type: "news-feed",
    x: 0, y: 5,
    w: 4, h: 8, minW: 3, minH: 5,
    settings: { ticker: "AAPL" },
  },
  {
    id: "market-news-1",
    type: "market-news",
    x: 4, y: 7,
    w: 4, h: 8, minW: 3, minH: 5,
    settings: {},
  },
];

type DashboardGridProps = {
  apiKey: string;
  onStockSelect?: (symbol: string) => void;
};

export default function DashboardGrid({
  apiKey,
  onStockSelect,
}: DashboardGridProps) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(defaultWidgets);
  const [mounted, setMounted] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Use a ref to track widgets for the drag/resize callbacks
  const widgetsRef = useRef<WidgetConfig[]>(widgets);

  // Keep ref in sync
  useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);

  // Load saved widget configs on mount
  useEffect(() => {
    const savedVersion = readStorage<number>("findash-layout-version", 0);
    const savedPreset = readStorage<string>(storageKeys.layoutPreset, "");
    const savedWidgets = readStorage<WidgetConfig[]>(storageKeys.widgetConfig, []);

    if (savedPreset && WIDGET_PRESETS[savedPreset] && savedWidgets.length === 0) {
      const preset = WIDGET_PRESETS[savedPreset];
      const presetWidgets: WidgetConfig[] = preset.widgets.map((w, i) => ({
        ...w,
        id: `${w.type}-${Date.now()}-${i}`,
      }));
      setWidgets(presetWidgets);
      writeStorage(storageKeys.widgetConfig, presetWidgets);
      writeStorage("findash-layout-version", LAYOUT_VERSION);
    } else if (savedVersion < LAYOUT_VERSION) {
      // Version mismatch — reset to clean defaults
      setWidgets(defaultWidgets);
      writeStorage(storageKeys.widgetConfig, defaultWidgets);
      writeStorage("findash-layout-version", LAYOUT_VERSION);
    } else if (savedWidgets.length > 0) {
      // Ensure each saved widget has proper minW/minH from defaults
      const migrated = savedWidgets.map((w) => {
        const defaults = WIDGET_DEFAULTS[w.type] || { w: 4, h: 5, minW: 3, minH: 4 };
        return {
          ...w,
          w: w.w || defaults.w,
          h: w.h || defaults.h,
          minW: w.minW || defaults.minW,
          minH: w.minH || defaults.minH,
        };
      });
      setWidgets(migrated);
    } else {
      setWidgets(defaultWidgets);
      writeStorage(storageKeys.widgetConfig, defaultWidgets);
    }

    // Delay mount to give time for state to settle before rendering the grid
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const layouts = useMemo(() => configsToLayouts(widgets), [widgets]);

  /**
   * Persist layout after user drag/resize.
   * We intentionally use onDragStop / onResizeStop instead of onLayoutChange
   * because onLayoutChange fires on EVERY re-layout (including initial render,
   * responsive breakpoint changes, etc.) which overwrites saved positions.
   */
  const saveCurrentLayout = useCallback((newLayout: Layout[]) => {
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

    // Only save if we didn't lose any widgets
    if (updated.length === currentWidgets.length) {
      setWidgets(updated);
      writeStorage(storageKeys.widgetConfig, updated);
      writeStorage("findash-layout-version", LAYOUT_VERSION);
    }
  }, []);

  const handleDragStop = useCallback(
    (layout: Layout[]) => saveCurrentLayout(layout),
    [saveCurrentLayout]
  );

  const handleResizeStop = useCallback(
    (layout: Layout[]) => saveCurrentLayout(layout),
    [saveCurrentLayout]
  );

  const handleAddWidget = useCallback((type: WidgetType) => {
    setWidgets((prev) => {
      const defaults = WIDGET_DEFAULTS[type] || { w: 4, h: 5, minW: 3, minH: 4 };
      const settings = getDefaultSettings(type);
      const maxY = prev.length > 0 ? Math.max(...prev.map((w) => w.y + w.h)) : 0;
      
      const newWidget: WidgetConfig = {
        id: `${type}-${Date.now()}`,
        type,
        x: 0,
        y: maxY,
        ...defaults,
        settings,
      };
      
      const updated = [...prev, newWidget];
      writeStorage(storageKeys.widgetConfig, updated);
      writeStorage("findash-layout-version", LAYOUT_VERSION);
      return updated;
    });
  }, []);

  const handleRemoveWidget = useCallback((id: string) => {
    setWidgets((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      writeStorage(storageKeys.widgetConfig, updated);
      return updated;
    });
  }, []);

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
            onTickerChange={(ticker) => {
              setWidgets((prev) => {
                const updated = prev.map((w) =>
                  w.id === config.id
                    ? { ...w, settings: { ...w.settings, ticker } }
                    : w
                );
                writeStorage(storageKeys.widgetConfig, updated);
                return updated;
              });
            }}
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
        existingTypes={widgets.map((w) => w.type)}
      />
    </>
  );
}
