"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ApiClient } from "@/lib/apiClient";
import { useDemoData } from "@/lib/DemoContext";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { usePortfolio } from "@/lib/UserContext";
import type { Holding } from "@/lib/models";
import WidgetBase from "@/components/widgets/WidgetBase";
import ChartDeferredRender from "@/components/ChartDeferredRender";
import { Plus } from "lucide-react";

type PortfolioTrackerProps = {
  apiKey: string;
  onClose?: () => void;
};

const COLORS = [
  "var(--accent-blue)",
  "var(--accent-green)",
  "var(--accent-amber)",
  "var(--accent-red)",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

export default function PortfolioTracker({ apiKey, onClose }: PortfolioTrackerProps) {
  const { holdings, setHoldings, portfolioError, retryPortfolio } = usePortfolio();
  const demo = useDemoData();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);
  const containerRef = useRef<HTMLDivElement>(null);
  const tickerKey = [...new Set(holdings.map(h => h.ticker.trim().toUpperCase()).filter(Boolean))].sort().join(',');
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => setContainerHeight(entries[0].contentRect.height));
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let cancelled = false;
    const client = new ApiClient({ apiKey, demo });
    async function refresh() {
      if (!apiKey || !tickerKey) return;
      setLoading(true);
      const symbols = tickerKey.split(',');
      const results = await Promise.allSettled(symbols.map(symbol => client.getQuote(symbol)));
      if (cancelled) return;
      const next: Record<string, number> = {};
      results.forEach((result, index) => { if (result.status === 'fulfilled') next[symbols[index]] = result.value.c; });
      setPrices(next);
      setQuoteError(results.some(r => r.status === 'rejected') ? 'Some quotes are unavailable. Refresh to retry.' : null);
      setLoading(false);
    }
    const timer = setTimeout(refresh, 500);
    const interval = setInterval(refresh, 60000);
    return () => { cancelled = true; clearTimeout(timer); clearInterval(interval); };
  }, [apiKey, tickerKey, refreshKey, demo]);
  const hasAllPrices = holdings.filter(h => h.quantity > 0).every(h => prices[h.ticker.trim().toUpperCase()] > 0);
  const portfolioData = useMemo(() => {

    const holdingData = holdings.map((h) => {
      const ticker = h.ticker.trim().toUpperCase();
      const price = prices[ticker] ?? 0;
      const qty = Number(h.quantity) || 0;
      const avgCost = Number(h.avgCost) || 0;
      const value = price * qty;
      const cost = avgCost * qty;
      const pnl = cost > 0 ? value - cost : 0;
      const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;


      return {
        ...h,
        price,
        value,
        pnl,
        pnlPercent,
      };
    });

    const totalValue = holdingData.reduce((sum, h) => sum + h.value, 0);
    const totalCost = holdingData.reduce((sum, h) => sum + h.quantity * h.avgCost, 0);
    const totalPnL = totalCost > 0 ? totalValue - totalCost : 0;
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    return {
      holdings: holdingData,
      totalValue,
      totalCost,
      totalPnL,
      totalPnLPercent,
    };
  }, [holdings, prices]);

  const donutData = useMemo(() => {
    return portfolioData.holdings
      .filter((h) => h.value > 0)
      .map((h) => ({
        name: h.ticker,
        value: h.value,
      }));
  }, [portfolioData]);

  const updateHolding = (id: string, update: Partial<Holding>) => {
    setHoldings(holdings.map(h => h.id === id ? { ...h, ...update } : h));
  };

  const addHolding = () => {
    setHoldings([
      ...holdings,
      { id: crypto.randomUUID(), ticker: "", quantity: 0, avgCost: 0 },
    ]);
  };

  const removeHolding = (id: string) => {
    setHoldings(holdings.filter(h => h.id !== id));
  };

  return (
    <WidgetBase
      title="Portfolio"
      onClose={onClose}
      onSettings={() => setRefreshKey(k => k + 1)}
    >
      <div ref={containerRef} className="flex h-full flex-col">
        {portfolioError && <p role="alert" className="mb-2 text-xs text-[var(--accent-red)]">{portfolioError} <button onClick={retryPortfolio} className="underline">Retry save</button></p>}
        {quoteError && <p className="mb-2 text-xs text-[var(--text-secondary)]">{quoteError}</p>}
        {/* Total Value */}
        <div className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Total Value
          </div>
          <div className="tabular-nums text-2xl font-bold text-[var(--text-primary)]">
            {loading && Object.keys(prices).length === 0 ? (
              <div className="skeleton h-7 w-32" />
            ) : (
              hasAllPrices ? formatCurrency(portfolioData.totalValue) : "—"
            )}
          </div>
          {hasAllPrices && portfolioData.totalCost > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`text-xs font-semibold ${
                  portfolioData.totalPnL >= 0
                    ? "text-[var(--accent-green)]"
                    : "text-[var(--accent-red)]"
                }`}
              >
                {portfolioData.totalPnL >= 0 ? "+" : ""}
                {formatCurrency(portfolioData.totalPnL)} P&L
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                ({formatPercent(portfolioData.totalPnLPercent)})
              </span>
            </div>
          )}
        </div>

        {/* Donut Chart */}
        {donutData.length > 0 && containerHeight >= 300 && (
          <div className="mb-3 h-32 min-h-[128px]">
            <ChartDeferredRender>
              <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {donutData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartDeferredRender>
          </div>
        )}

        {/* Holdings */}
        <div className="flex-1 space-y-2 overflow-y-auto pr-1 min-h-0">
          {holdings.length === 0 && <p className="py-4 text-center text-xs text-[var(--text-secondary)]">Add your first holding to track its value and performance.</p>}
          {portfolioData.holdings.map((h) => (
            <div
              key={h.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2 transition-colors hover:bg-[var(--bg-card-hover)]"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="mono text-sm font-semibold text-[var(--text-primary)]">
                  {h.ticker || "—"}
                </div>
                <button
                  onClick={() => removeHolding(h.id)}
                  className="text-[var(--text-muted)] hover:text-[var(--accent-red)]"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-[var(--text-muted)]">Ticker</label>
                  <input
                    aria-label="Holding ticker"
                    value={h.ticker}
                    onChange={(e) =>
                      updateHolding(h.id, { ticker: e.target.value.toUpperCase() })
                    }
                    className="mono w-full rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-1.5 py-0.5 text-xs uppercase outline-none"
                    placeholder="TICKER"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--text-muted)]">Qty</label>
                  <input
                    type="number"
                    aria-label="Holding quantity"
                    min="0"
                    step="any"
                    value={h.quantity || ""}
                    onChange={(e) =>
                      updateHolding(h.id, { quantity: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-full rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-1.5 py-0.5 text-xs outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--text-muted)]">Avg Cost</label>
                  <input
                    type="number"
                    aria-label="Holding average cost"
                    min="0"
                    step="0.01"
                    value={h.avgCost || ""}
                    onChange={(e) =>
                      updateHolding(h.id, { avgCost: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-full rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-1.5 py-0.5 text-xs outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="text-[10px] text-[var(--text-muted)]">Price</label>
                  <div className="tabular-nums text-xs text-[var(--text-secondary)] py-0.5">
                    {h.price > 0 ? formatCurrency(h.price) : "—"}
                  </div>
                </div>
              </div>
              {h.price > 0 && (
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="tabular-nums text-[var(--text-secondary)]">
                    Value: {formatCurrency(h.value)}
                  </span>
                  {h.avgCost > 0 ? (
                    <span
                      className={`tabular-nums font-semibold ${
                        h.pnl >= 0
                          ? "text-[var(--accent-green)]"
                          : "text-[var(--accent-red)]"
                      }`}
                    >
                      {h.pnl >= 0 ? "+" : ""}
                      {formatCurrency(h.pnl)} ({formatPercent(h.pnlPercent)})
                    </span>
                  ) : (
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Set avg cost for P&L
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
          <button
            onClick={addHolding}
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--border)] py-2 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Holding
          </button>
        </div>
      </div>
    </WidgetBase>
  );
}
