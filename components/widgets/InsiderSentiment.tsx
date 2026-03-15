"use client";

import { useEffect, useState, useRef } from "react";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import ChartDeferredRender from "@/components/ChartDeferredRender";
import { ApiClient } from "@/lib/apiClient";
import WidgetBase from "@/components/widgets/WidgetBase";
import { Users } from "lucide-react";

type InsiderSentimentProps = {
  apiKey: string;
  ticker?: string;
  onClose?: () => void;
  onTickerChange?: (ticker: string) => void;
};

export default function InsiderSentiment({
  apiKey,
  ticker: initialTicker = "AAPL",
  onClose,
  onTickerChange,
}: InsiderSentimentProps) {
  const [ticker, setTicker] = useState(initialTicker);
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<ApiClient | null>(null);

  useEffect(() => {
    if (apiKey) {
      clientRef.current = new ApiClient({ apiKey });
    }
  }, [apiKey]);

  const loadData = async () => {
    if (!clientRef.current || !ticker.trim()) return;

    setLoading(true);
    setError(null);

    const symbol = ticker.trim().toUpperCase();
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    try {
      const result = await clientRef.current.getInsiderSentiment(
        symbol,
        oneYearAgo.toISOString().split("T")[0],
        now.toISOString().split("T")[0]
      );

      const chartData = result.slice(-12).map((item) => ({
        month: `${item.year}-${String(item.month).padStart(2, "0")}`,
        mspr: item.mspr,
        change: item.change,
      }));

      setData(chartData);
    } catch (err: any) {
      if (err.message?.includes("ACCESS_DENIED")) {
        setError("Insider sentiment may require a premium plan.");
      } else {
        setError(err.message || "Failed to load data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey && ticker) {
      loadData();
    }
  }, [apiKey, ticker]);

  const handleTickerSubmit = (newTicker: string) => {
    const symbol = newTicker.trim().toUpperCase();
    if (symbol) {
      setTicker(symbol);
      setIsEditing(false);
      onTickerChange?.(symbol);
    }
  };

  const avgMspr =
    data.length > 0
      ? data.reduce((sum, d) => sum + (d.mspr || 0), 0) / data.length
      : 0;

  return (
    <WidgetBase title={`${ticker} — Insider Sentiment`} onClose={onClose}>
      <div className="flex h-full flex-col">
        {/* Ticker edit */}
        <div className="mb-3 flex items-center justify-between">
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
                {ticker} ✎
              </button>
            )}
          </div>
          {data.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-[var(--text-muted)]" />
              <span
                className={`text-xs font-semibold ${
                  avgMspr >= 0 ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"
                }`}
              >
                {avgMspr >= 0 ? "Bullish" : "Bearish"}
              </span>
            </div>
          )}
        </div>

        {loading && (
          <div className="space-y-2">
            <div className="skeleton h-32 w-full rounded-lg" />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg bg-[var(--accent-amber)]/10 border border-[var(--accent-amber)]/20 px-2 py-1 text-xs text-[var(--accent-amber)]">
            {error}
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="mb-2 h-6 w-6 text-[var(--text-muted)]" />
            <div className="text-xs text-[var(--text-secondary)]">
              No insider sentiment data available
            </div>
          </div>
        )}

        {!loading && data.length > 0 && (
          <div className="flex-1 min-h-[120px]">
            <ChartDeferredRender>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 9, fill: "var(--text-muted)" }}
                    tickFormatter={(v) => {
                      const parts = v.split("-");
                      return parts[1];
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                    formatter={(value: number) => [value.toFixed(4), "MSPR"]}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Bar dataKey="mspr" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.mspr >= 0
                            ? "var(--accent-green)"
                            : "var(--accent-red)"
                        }
                        fillOpacity={0.7}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartDeferredRender>
          </div>
        )}
      </div>
    </WidgetBase>
  );
}
