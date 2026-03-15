"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from "recharts";
import { ApiClient } from "@/lib/apiClient";
import { formatCurrency } from "@/lib/formatters";
import WidgetBase from "@/components/widgets/WidgetBase";
import ChartDeferredRender from "@/components/ChartDeferredRender";

type PriceChartProps = {
  apiKey: string;
  ticker?: string;
  timeRange?: string;
  onClose?: () => void;
};

const TIME_RANGES = [
  { label: "1D", resolution: "5" as const, days: 1 },
  { label: "1W", resolution: "60" as const, days: 7 },
  { label: "1M", resolution: "D" as const, days: 30 },
  { label: "3M", resolution: "D" as const, days: 90 },
  { label: "6M", resolution: "D" as const, days: 180 },
  { label: "1Y", resolution: "W" as const, days: 365 },
];

export default function PriceChart({
  apiKey,
  ticker: initialTicker = "AAPL",
  timeRange: initialTimeRange = "1M",
  onClose,
}: PriceChartProps) {
  const [ticker, setTicker] = useState(initialTicker);
  const [isEditing, setIsEditing] = useState(false);
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [candleData, setCandleData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<ApiClient | null>(null);
  useEffect(() => {
    if (apiKey) {
      clientRef.current = new ApiClient({ apiKey });
    }
  }, [apiKey]);

  const loadData = useCallback(async () => {
    if (!clientRef.current || !ticker.trim()) return;

    const range = TIME_RANGES.find((r) => r.label === timeRange) || TIME_RANGES[2];
    const to = Math.floor(Date.now() / 1000);
    const from = to - range.days * 24 * 60 * 60;

    setLoading(true);
    setError(null);

    try {
      const data = await clientRef.current.getCandle(
        ticker.trim().toUpperCase(),
        range.resolution,
        from,
        to
      );
      
      if (!data.c || data.c.length === 0) {
        setError("No chart data available for this period.");
        setCandleData(null);
      } else {
        setCandleData(data);
      }
    } catch (err: any) {
      const message = err.message || "Failed to load chart data";
      // Make errors more user-friendly
      if (message.includes("ACCESS_DENIED") || message.includes("403")) {
        setError("Chart data requires a premium Finnhub plan. Quotes and news still work on the free tier.");
      } else if (message.includes("NO_DATA")) {
        setError("No data available for this symbol/period.");
      } else {
        setError(message);
      }
      setCandleData(null);
    } finally {
      setLoading(false);
    }
  }, [ticker, timeRange]);

  useEffect(() => {
    if (apiKey && ticker) {
      loadData();
    }
  }, [apiKey, ticker, timeRange, loadData]);

  const chartData = useMemo(() => {
    if (!candleData || !candleData.c || !candleData.t) return [];
    
    return candleData.t.map((timestamp: number, i: number) => ({
      date: new Date(timestamp * 1000),
      close: candleData.c[i],
      volume: candleData.v?.[i] || 0,
      high: candleData.h?.[i] || candleData.c[i],
      low: candleData.l?.[i] || candleData.c[i],
      open: candleData.o?.[i] || candleData.c[i],
    }));
  }, [candleData]);

  const isUp =
    chartData.length >= 2
      ? chartData[chartData.length - 1].close >= chartData[0].close
      : true;

  const handleTickerSubmit = (newTicker: string) => {
    const symbol = newTicker.trim().toUpperCase();
    if (symbol) {
      setTicker(symbol);
      setIsEditing(false);
    }
  };

  return (
    <WidgetBase title={`${ticker} — Price Chart`} onClose={onClose}>
      <div className="flex h-full flex-col">
        {/* Top controls: ticker + time range */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            {isEditing ? (
              <input
                autoFocus
                defaultValue={ticker}
                onBlur={(e) => handleTickerSubmit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTickerSubmit(e.currentTarget.value);
                  if (e.key === "Escape") setIsEditing(false);
                }}
                className="mono w-24 rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1 text-xs font-semibold uppercase outline-none focus:border-[var(--accent-blue)]"
              />
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="mono text-xs font-semibold uppercase text-[var(--accent-blue)] hover:underline"
              >
                {ticker}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range.label}
                onClick={() => setTimeRange(range.label)}
                className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                  timeRange === range.label
                    ? "bg-[var(--accent-blue)] text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0">
          {loading && (
            <div className="flex h-full items-center justify-center">
              <div className="skeleton h-32 w-full rounded-lg" />
            </div>
          )}
          {error && !loading && (
            <div className="flex h-full items-center justify-center p-4">
              <div className="rounded-lg bg-[var(--accent-amber)]/10 border border-[var(--accent-amber)]/20 px-4 py-3 text-center">
                <p className="text-xs text-[var(--accent-amber)] font-medium">{error}</p>
              </div>
            </div>
          )}
          {!loading && !error && chartData.length > 0 && (
            <ChartDeferredRender>
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient
                    id={`priceGradient-${ticker}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={
                        isUp ? "var(--accent-green)" : "var(--accent-red)"
                      }
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor={
                        isUp ? "var(--accent-green)" : "var(--accent-red)"
                      }
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date: Date) => {
                    if (timeRange === "1D") {
                      return date.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      });
                    }
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  fontSize={10}
                  stroke="var(--text-secondary)"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="price"
                  width={60}
                  tickFormatter={(v) => `$${v.toFixed(0)}`}
                  fontSize={10}
                  stroke="var(--text-secondary)"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="volume"
                  orientation="right"
                  width={40}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  fontSize={9}
                  stroke="var(--text-muted)"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "close" || name === "high" || name === "low" || name === "open") {
                      return formatCurrency(value);
                    }
                    return (value || 0).toLocaleString();
                  }}
                  labelFormatter={(label: Date) =>
                    label.toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  }
                />
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke={isUp ? "var(--accent-green)" : "var(--accent-red)"}
                  strokeWidth={2}
                  fill={`url(#priceGradient-${ticker})`}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Bar
                  yAxisId="volume"
                  dataKey="volume"
                  fill="var(--text-muted)"
                  opacity={0.3}
                  radius={[2, 2, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
            </ChartDeferredRender>
          )}
          {!loading && !error && chartData.length === 0 && (
            <div className="flex h-full items-center justify-center text-xs text-[var(--text-secondary)]">
              No chart data. Click the ticker to change symbol.
            </div>
          )}
        </div>
      </div>
    </WidgetBase>
  );
}
