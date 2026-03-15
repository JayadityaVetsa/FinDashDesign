"use client";

import { useEffect, useState, useRef } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import ChartDeferredRender from "@/components/ChartDeferredRender";
import { ApiClient } from "@/lib/apiClient";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import WidgetBase from "@/components/widgets/WidgetBase";

type MarketOverviewProps = {
  apiKey: string;
  onClose?: () => void;
};

const INDICES = [
  { symbol: "SPY", name: "S&P 500" },
  { symbol: "QQQ", name: "NASDAQ" },
  { symbol: "DIA", name: "DOW" },
  { symbol: "IWM", name: "Russell 2000" },
];

export default function MarketOverview({ apiKey, onClose }: MarketOverviewProps) {
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(false);
  const [containerWidth, setContainerWidth] = useState(400);
  const containerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<ApiClient | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
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

  const loadData = async () => {
    if (!clientRef.current) return;
    
    setLoading(true);
    try {
      // Load quotes first (always works on free tier)
      const quoteResults = await Promise.all(
        INDICES.map(async (index) => {
          try {
            const quote = await clientRef.current!.getQuote(index.symbol);
            return { symbol: index.symbol, quote };
          } catch {
            return null;
          }
        })
      );

      const quotesMap: Record<string, any> = {};
      quoteResults.forEach((result) => {
        if (result) {
          quotesMap[result.symbol] = result.quote;
        }
      });
      setQuotes(quotesMap);

      // Then try sparklines separately (may fail on free tier, that's ok)
      try {
        const candleResults = await Promise.all(
          INDICES.map(async (index) => {
            try {
              const candle = await clientRef.current!.getCandle(
                index.symbol,
                "D",
                Math.floor(Date.now() / 1000) - 5 * 24 * 60 * 60,
                Math.floor(Date.now() / 1000)
              );
              return { symbol: index.symbol, sparkline: candle.c?.slice(-5) || [] };
            } catch {
              return { symbol: index.symbol, sparkline: [] };
            }
          })
        );

        const sparklinesMap: Record<string, number[]> = {};
        candleResults.forEach((result) => {
          if (result.sparkline.length > 0) {
            sparklinesMap[result.symbol] = result.sparkline;
          }
        });
        setSparklines(sparklinesMap);
      } catch {
        // Sparklines are optional
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      loadData();
      const interval = setInterval(loadData, 60000);
      return () => clearInterval(interval);
    }
  }, [apiKey]);

  return (
    <WidgetBase title="Market Overview" onClose={onClose}>
      <div ref={containerRef} className="space-y-2">
        {INDICES.map((index) => {
          const quote = quotes[index.symbol];
          const sparkline = sparklines[index.symbol] || [];
          const isPositive = quote ? quote.dp >= 0 : true;

          return (
            <div
              key={index.symbol}
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2 transition-colors hover:bg-[var(--bg-card-hover)]"
            >
              <div className="flex-1 min-w-0">
                <div className="mono text-xs font-semibold text-[var(--text-primary)]">
                  {index.symbol}
                </div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  {index.name}
                </div>
              </div>
              {loading && !quote ? (
                <div className="skeleton h-8 w-16" />
              ) : quote ? (
                <>
                  <div className="tabular-nums text-right">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">
                      {formatCurrency(quote.c)}
                    </div>
                    <div
                      className={`text-xs ${
                        isPositive
                          ? "text-[var(--accent-green)]"
                          : "text-[var(--accent-red)]"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {formatPercent(quote.dp)}
                    </div>
                  </div>
                  {sparkline.length > 0 && containerWidth >= 260 && (
                    <div className="h-8 w-16">
                      <ChartDeferredRender>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={sparkline.map((v, i) => ({ value: v, index: i }))}>
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={
                                isPositive
                                  ? "var(--accent-green)"
                                  : "var(--accent-red)"
                              }
                              strokeWidth={1.5}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartDeferredRender>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs text-[var(--text-muted)]">—</div>
              )}
            </div>
          );
        })}
      </div>
    </WidgetBase>
  );
}
