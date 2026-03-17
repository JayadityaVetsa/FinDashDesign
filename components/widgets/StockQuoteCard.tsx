"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ApiClient } from "@/lib/apiClient";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import WidgetBase from "@/components/widgets/WidgetBase";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import ChartDeferredRender from "@/components/ChartDeferredRender";

type StockQuoteCardProps = {
  apiKey: string;
  ticker?: string;
  onTickerChange?: (ticker: string) => void;
  onClose?: () => void;
};

export default function StockQuoteCard({
  apiKey,
  ticker: initialTicker = "AAPL",
  onTickerChange,
  onClose,
}: StockQuoteCardProps) {
  const [ticker, setTicker] = useState(initialTicker);
  const [isEditing, setIsEditing] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [sparkline, setSparkline] = useState<{ date: string; close: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricePulse, setPricePulse] = useState<"green" | "red" | null>(null);
  const prevPriceRef = useRef<number | null>(null);
  const clientRef = useRef<ApiClient | null>(null);
  useEffect(() => {
    if (apiKey) {
      clientRef.current = new ApiClient({ apiKey });
    }
  }, [apiKey]);

  const loadData = useCallback(async () => {
    if (!clientRef.current || !ticker.trim()) return;
    
    setLoading(true);
    setError(null);
    
    const symbol = ticker.trim().toUpperCase();

    // Load quote FIRST (always works on free tier)
    try {
      const quoteData = await clientRef.current.getQuote(symbol);
      setQuote(quoteData);

      // Price pulse animation
      if (prevPriceRef.current !== null && quoteData.c !== prevPriceRef.current) {
        setPricePulse(quoteData.c > prevPriceRef.current ? "green" : "red");
        setTimeout(() => setPricePulse(null), 600);
      }
      prevPriceRef.current = quoteData.c;
    } catch (err: any) {
      setError(err.message);
    }

    // Then try sparkline separately — don't fail if candle 403s
    try {
      const candleData = await clientRef.current.getCandle(
        symbol,
        "D",
        Math.floor(Date.now() / 1000) - 5 * 24 * 60 * 60,
        Math.floor(Date.now() / 1000)
      );
      if (candleData.c && candleData.t) {
        const sparkData = candleData.t.slice(-5).map((timestamp: number, i: number) => ({
          date: new Date(timestamp * 1000).toLocaleDateString(),
          close: candleData.c[i],
        }));
        setSparkline(sparkData);
      }
    } catch {
      // Sparkline is optional — silently skip if candles aren't available (e.g., free tier)
      setSparkline([]);
    }

    setLoading(false);
  }, [ticker]);

  useEffect(() => {
    if (apiKey && ticker) {
      loadData();
    }
  }, [apiKey, ticker, loadData]);

  const handleTickerSubmit = (newTicker: string) => {
    const symbol = newTicker.trim().toUpperCase();
    if (symbol) {
      setTicker(symbol);
      setIsEditing(false);
      onTickerChange?.(symbol);
    }
  };

  const isPositive = quote ? quote.dp >= 0 : true;

  return (
    <WidgetBase title="Stock Quote" onClose={onClose}>
      <div className="flex h-full flex-col">
        {/* Ticker display/edit */}
        <div className="mb-3">
          {isEditing ? (
            <input
              autoFocus
              defaultValue={ticker}
              onBlur={(e) => handleTickerSubmit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleTickerSubmit(e.currentTarget.value);
                } else if (e.key === "Escape") {
                  setIsEditing(false);
                }
              }}
              className="mono w-full rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1 text-sm font-semibold uppercase outline-none focus:border-[var(--accent-blue)]"
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="mono text-left text-sm font-semibold uppercase text-[var(--accent-blue)] hover:underline"
            >
              {ticker}
            </button>
          )}
        </div>

        {/* Large price */}
        <div
          className={`mb-3 rounded-lg p-2 transition-colors ${
            pricePulse === "green"
              ? "price-pulse-green"
              : pricePulse === "red"
              ? "price-pulse-red"
              : ""
          }`}
        >
          <div className="tabular-nums text-3xl font-bold text-[var(--text-primary)]">
            {loading ? (
              <div className="skeleton h-9 w-32" />
            ) : quote ? (
              formatCurrency(quote.c)
            ) : (
              "--"
            )}
          </div>
          {quote && !loading && (
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                  isPositive
                    ? "bg-[var(--accent-green)]/20 text-[var(--accent-green)]"
                    : "bg-[var(--accent-red)]/20 text-[var(--accent-red)]"
                }`}
              >
                {isPositive ? "▲" : "▼"} {formatPercent(Math.abs(quote.dp))}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                {quote.d > 0 ? "+" : ""}
                {formatCurrency(quote.d)}
              </span>
            </div>
          )}
        </div>

        {/* OHLC Grid */}
        {quote && !loading && (
          <div className="mb-3 grid grid-cols-2 gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-2">
            <div>
              <div className="text-[10px] text-[var(--text-muted)]">Open</div>
              <div className="tabular-nums text-sm font-semibold text-[var(--text-primary)]">
                {formatCurrency(quote.o)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[var(--text-muted)]">High</div>
              <div className="tabular-nums text-sm font-semibold text-[var(--accent-green)]">
                {formatCurrency(quote.h)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[var(--text-muted)]">Low</div>
              <div className="tabular-nums text-sm font-semibold text-[var(--accent-red)]">
                {formatCurrency(quote.l)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[var(--text-muted)]">Prev Close</div>
              <div className="tabular-nums text-sm font-semibold text-[var(--text-primary)]">
                {formatCurrency(quote.pc)}
              </div>
            </div>
          </div>
        )}

        {/* Sparkline (only shown if candle data available) */}
        {sparkline.length > 0 && (
          <div className="mt-auto h-12">
            <ChartDeferredRender>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkline}>
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke={isPositive ? "var(--accent-green)" : "var(--accent-red)"}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      fontSize: "11px",
                    }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartDeferredRender>
          </div>
        )}

        {error && (
          <div className="mt-2 rounded-lg bg-[var(--accent-red)]/10 px-2 py-1 text-xs text-[var(--accent-red)]">
            {error}
          </div>
        )}
      </div>
    </WidgetBase>
  );
}
