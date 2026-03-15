"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ApiClient } from "@/lib/apiClient";
import WidgetBase from "@/components/widgets/WidgetBase";

type MarketNewsFeedProps = {
  apiKey: string;
  onClose?: () => void;
};

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

export default function MarketNewsFeed({ apiKey, onClose }: MarketNewsFeedProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<ApiClient | null>(null);

  useEffect(() => {
    if (apiKey) {
      clientRef.current = new ApiClient({ apiKey });
    }
  }, [apiKey]);

  const loadData = useCallback(async () => {
    if (!clientRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const news = await clientRef.current.getMarketNews("general");
      setItems(news.slice(0, 15)); // Limit to 15 items
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (apiKey) {
      loadData();
    }
  }, [apiKey, loadData]);

  return (
    <WidgetBase title="Market News" onClose={onClose}>
      <div className="flex h-full flex-col">
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
              No news available
            </div>
          )}
          {items.map((item, idx) => (
            <a
              key={`${item.id}-${idx}`}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-[var(--border)] p-3 transition-all hover:border-[var(--border-active)] hover:bg-[var(--bg-card-hover)]"
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[var(--bg-secondary)] text-[8px] text-[var(--text-muted)]">
                  {item.source?.[0]?.toUpperCase() || "N"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug text-[var(--text-primary)] line-clamp-2">
                    {item.headline}
                  </p>
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
          ))}
        </div>
      </div>
    </WidgetBase>
  );
}
