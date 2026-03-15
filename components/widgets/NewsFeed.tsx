"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ApiClient } from "@/lib/apiClient";
import WidgetBase from "@/components/widgets/WidgetBase";

type NewsFeedProps = {
  apiKey: string;
  ticker?: string;
  onClose?: () => void;
  onTickerChange?: (ticker: string) => void;
};

// Simple sentiment detection based on keywords
function detectSentiment(headline: string, summary: string): "BULLISH" | "BEARISH" | "NEUTRAL" {
  const text = (headline + " " + summary).toLowerCase();
  const bullish = ["surge", "rally", "gain", "up", "rise", "beat", "strong", "growth", "profit", "positive"];
  const bearish = ["drop", "fall", "decline", "down", "loss", "miss", "weak", "crash", "negative", "worry"];
  
  const bullishCount = bullish.filter(word => text.includes(word)).length;
  const bearishCount = bearish.filter(word => text.includes(word)).length;
  
  if (bullishCount > bearishCount) return "BULLISH";
  if (bearishCount > bullishCount) return "BEARISH";
  return "NEUTRAL";
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NewsFeed({ apiKey, ticker: initialTicker = "AAPL", onClose, onTickerChange }: NewsFeedProps) {
  const [ticker, setTicker] = useState(initialTicker);
  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<ApiClient | null>(null);

  const handleTickerSubmit = (newTicker: string) => {
    const symbol = newTicker.trim().toUpperCase();
    if (symbol) {
      setTicker(symbol);
      setIsEditing(false);
      onTickerChange?.(symbol);
    }
  };

  useEffect(() => {
    if (apiKey) {
      clientRef.current = new ApiClient({ apiKey });
    }
  }, [apiKey]);

  const loadData = useCallback(async () => {
    if (!clientRef.current || !ticker.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const from = new Date();
      from.setDate(from.getDate() - 7); // Last 7 days
      const to = new Date();
      
      const news = await clientRef.current.getCompanyNews(
        ticker.trim().toUpperCase(),
        from.toISOString().split("T")[0],
        to.toISOString().split("T")[0]
      );
      
      setItems(news.slice(0, 20)); // Limit to 20 items
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    if (apiKey && ticker) {
      loadData();
    }
  }, [apiKey, ticker, loadData]);

  return (
    <WidgetBase title={`${ticker} — News`} onClose={onClose}>
      <div className="flex h-full flex-col">
        {/* Ticker edit */}
        <div className="mb-2">
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

        {/* News list */}
        <div className="flex-1 space-y-2 overflow-y-auto pr-1 min-h-0">
          {loading && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-20 w-full rounded-lg" />
              ))}
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-[var(--accent-red)]/10 px-2 py-1 text-xs text-[var(--accent-red)]">
              {error}
            </div>
          )}
          {!loading && !error && items.length === 0 && (
            <div className="py-4 text-center text-xs text-[var(--text-secondary)]">
              No news found
            </div>
          )}
          {items.map((item, idx) => {
            const sentiment = detectSentiment(item.headline, item.summary || "");
            return (
              <a
                key={`${item.id}-${idx}`}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-[var(--border)] p-3 transition-all hover:border-[var(--border-active)] hover:bg-[var(--bg-card-hover)]"
              >
                <div className="flex items-start gap-2">
                  {/* Favicon placeholder */}
                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[var(--bg-secondary)] text-[8px] text-[var(--text-muted)]">
                    {item.source?.[0]?.toUpperCase() || "N"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug text-[var(--text-primary)] line-clamp-2">
                        {item.headline}
                      </p>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          sentiment === "BULLISH"
                            ? "bg-[var(--accent-green)]/20 text-[var(--accent-green)]"
                            : sentiment === "BEARISH"
                            ? "bg-[var(--accent-red)]/20 text-[var(--accent-red)]"
                            : "bg-[var(--text-muted)]/20 text-[var(--text-muted)]"
                        }`}
                      >
                        {sentiment}
                      </span>
                    </div>
                    {item.summary && (
                      <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)] line-clamp-2">
                        {item.summary}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                      <span className="font-medium">{item.source}</span>
                      <span>·</span>
                      <span>{timeAgo(item.datetime)}</span>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </WidgetBase>
  );
}
