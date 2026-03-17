"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ApiClient } from "@/lib/apiClient";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { useUserId } from "@/lib/UserContext";
import { getProfile, updateProfile } from "@/lib/supabaseData";
import WidgetBase from "@/components/widgets/WidgetBase";
import ChartDeferredRender from "@/components/ChartDeferredRender";
import { Plus } from "lucide-react";

type Holding = {
  id: string;
  ticker: string;
  quantity: number;
  avgCost: number;
};

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

const DEFAULT_HOLDINGS: Holding[] = [
  { id: "default-1", ticker: "AAPL", quantity: 10, avgCost: 150 },
  { id: "default-2", ticker: "MSFT", quantity: 6, avgCost: 350 },
  { id: "default-3", ticker: "GOOGL", quantity: 4, avgCost: 140 },
];

function migrateHoldings(raw: any[]): Holding[] {
  return raw.map((h) => ({
    id: h.id || crypto.randomUUID(),
    ticker: h.ticker || "",
    quantity: Number(h.quantity) || 0,
    avgCost: Number(h.avgCost) || 0,
  }));
}

export default function PortfolioTracker({ apiKey, onClose }: PortfolioTrackerProps) {
  const userId = useUserId();

  const [holdings, setHoldings] = useState<Holding[]>(DEFAULT_HOLDINGS);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [containerHeight, setContainerHeight] = useState(400);
  const containerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<ApiClient | null>(null);
  const hasRefreshed = useRef(false);
  const initialized = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (apiKey) {
      clientRef.current = new ApiClient({ apiKey });
    }
  }, [apiKey]);

  // Load holdings from Supabase on mount
  useEffect(() => {
    if (!userId) return;

    async function load() {
      try {
        const profile = await getProfile(userId);
        if (profile && Array.isArray(profile.portfolio_holdings) && profile.portfolio_holdings.length > 0) {
          setHoldings(migrateHoldings(profile.portfolio_holdings));
        }
        // else keep DEFAULT_HOLDINGS
      } catch {
        // keep defaults on error
      }
      initialized.current = true;
    }

    load();
  }, [userId]);

  // Persist holdings to Supabase (debounced)
  useEffect(() => {
    if (!initialized.current || !userId) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updateProfile(userId, { portfolio_holdings: holdings }).catch((err) =>
        console.error("Failed to save portfolio:", err)
      );
    }, 800);
  }, [holdings, userId]);

  const refresh = useCallback(async () => {
    if (!clientRef.current || holdings.length === 0) return;
    const tickers = holdings
      .map((h) => h.ticker.trim().toUpperCase())
      .filter(Boolean);
    if (tickers.length === 0) return;

    setLoading(true);

    try {
      const results = await Promise.all(
        tickers.map(async (t) => {
          try {
            const quote = await clientRef.current!.getQuote(t);
            return { ticker: t, price: quote.c || 0 };
          } catch {
            return { ticker: t, price: 0 };
          }
        })
      );

      const next: Record<string, number> = {};
      results.forEach((r) => {
        next[r.ticker] = r.price;
      });
      setPrices(next);
    } finally {
      setLoading(false);
    }
  }, [holdings]);

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!apiKey || hasRefreshed.current) return;
    hasRefreshed.current = true;

    const timeout = setTimeout(() => {
      refreshRef.current();
    }, 800);
    return () => clearTimeout(timeout);
  }, [apiKey]);

  const portfolioData = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;

    const holdingData = holdings.map((h) => {
      const ticker = h.ticker.trim().toUpperCase();
      const price = prices[ticker] ?? 0;
      const qty = Number(h.quantity) || 0;
      const avgCost = Number(h.avgCost) || 0;
      const value = price * qty;
      const cost = avgCost * qty;
      const pnl = cost > 0 ? value - cost : 0;
      const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;

      totalValue += value;
      totalCost += cost;

      return {
        ...h,
        price,
        value,
        pnl,
        pnlPercent,
      };
    });

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
    setHoldings((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...update } : h))
    );
  };

  const addHolding = () => {
    setHoldings((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ticker: "", quantity: 0, avgCost: 0 },
    ]);
  };

  const removeHolding = (id: string) => {
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <WidgetBase
      title="Portfolio"
      onClose={onClose}
      onSettings={() => {
        hasRefreshed.current = false;
        refresh();
      }}
    >
      <div ref={containerRef} className="flex h-full flex-col">
        {/* Total Value */}
        <div className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Total Value
          </div>
          <div className="tabular-nums text-2xl font-bold text-[var(--text-primary)]">
            {loading && Object.keys(prices).length === 0 ? (
              <div className="skeleton h-7 w-32" />
            ) : (
              formatCurrency(portfolioData.totalValue)
            )}
          </div>
          {portfolioData.totalCost > 0 && (
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
                    value={h.quantity || ""}
                    onChange={(e) =>
                      updateHolding(h.id, { quantity: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-1.5 py-0.5 text-xs outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--text-muted)]">Avg Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={h.avgCost || ""}
                    onChange={(e) =>
                      updateHolding(h.id, { avgCost: Number(e.target.value) || 0 })
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
