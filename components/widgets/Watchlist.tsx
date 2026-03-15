"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ApiClient } from "@/lib/apiClient";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import WidgetBase from "@/components/widgets/WidgetBase";
import { Plus, ArrowUpDown } from "lucide-react";

type WatchlistProps = {
  apiKey: string;
  tickers?: string[];
  onClose?: () => void;
};

type SortField = "ticker" | "price" | "change" | "high" | "low" | "volume";
type SortDirection = "asc" | "desc";

export default function Watchlist({
  apiKey,
  tickers: initialTickers = ["AAPL", "MSFT", "GOOGL"],
  onClose,
}: WatchlistProps) {
  const [tickers, setTickers] = useState<string[]>(initialTickers);
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>("ticker");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [newTicker, setNewTicker] = useState("");
  const clientRef = useRef<ApiClient | null>(null);

  useEffect(() => {
    if (apiKey) {
      clientRef.current = new ApiClient({ apiKey });
    }
  }, [apiKey]);

  const loadData = useCallback(async () => {
    if (!clientRef.current || tickers.length === 0) return;
    
    setLoading(true);
    try {
      const results = await Promise.all(
        tickers.map(async (ticker) => {
          try {
            const quote = await clientRef.current!.getQuote(ticker.trim().toUpperCase());
            return { ticker: ticker.trim().toUpperCase(), quote };
          } catch {
            return { ticker: ticker.trim().toUpperCase(), quote: null };
          }
        })
      );

      const quotesMap: Record<string, any> = {};
      results.forEach((result) => {
        if (result.quote) {
          quotesMap[result.ticker] = result.quote;
        }
      });
      
      setQuotes(quotesMap);
    } finally {
      setLoading(false);
    }
  }, [tickers]);

  useEffect(() => {
    if (apiKey) {
      loadData();
      const interval = setInterval(loadData, 60000); // Auto-refresh every 60s
      return () => clearInterval(interval);
    }
  }, [apiKey, loadData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedTickers = [...tickers].sort((a, b) => {
    const quoteA = quotes[a] || {};
    const quoteB = quotes[b] || {};
    let comparison = 0;

    switch (sortField) {
      case "ticker":
        comparison = a.localeCompare(b);
        break;
      case "price":
        comparison = (quoteA.c || 0) - (quoteB.c || 0);
        break;
      case "change":
        comparison = (quoteA.dp || 0) - (quoteB.dp || 0);
        break;
      case "high":
        comparison = (quoteA.h || 0) - (quoteB.h || 0);
        break;
      case "low":
        comparison = (quoteA.l || 0) - (quoteB.l || 0);
        break;
      case "volume":
        comparison = (quoteA.v || 0) - (quoteB.v || 0);
        break;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const addTicker = () => {
    const ticker = newTicker.trim().toUpperCase();
    if (ticker && !tickers.includes(ticker)) {
      setTickers([...tickers, ticker]);
      setNewTicker("");
    }
  };

  const removeTicker = (ticker: string) => {
    setTickers(tickers.filter((t) => t !== ticker));
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-[var(--accent-blue)]"
    >
      {children}
      {sortField === field && (
        <ArrowUpDown className="h-3 w-3" />
      )}
    </button>
  );

  return (
    <WidgetBase title="Watchlist" onClose={onClose}>
      <div className="flex h-full flex-col">
        {/* Add ticker */}
        <div className="mb-2 flex gap-2">
          <input
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTicker();
            }}
            className="mono flex-1 rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1 text-xs uppercase outline-none"
            placeholder="TICKER"
          />
          <button
            onClick={addTicker}
            className="flex items-center gap-1 rounded border border-[var(--border)] bg-[var(--accent-blue)] px-2 py-1 text-xs text-white"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[var(--bg-primary)]">
              <tr className="border-b border-[var(--border)]">
                <th className="py-1.5 text-left">
                  <SortButton field="ticker">Ticker</SortButton>
                </th>
                <th className="py-1.5 text-right">
                  <SortButton field="price">Price</SortButton>
                </th>
                <th className="py-1.5 text-right">
                  <SortButton field="change">Change</SortButton>
                </th>
                <th className="py-1.5 text-right">
                  <SortButton field="high">High</SortButton>
                </th>
                <th className="py-1.5 text-right">
                  <SortButton field="low">Low</SortButton>
                </th>
                <th className="py-1.5 text-right">
                  <SortButton field="volume">Vol</SortButton>
                </th>
                <th className="w-6"></th>
              </tr>
            </thead>
            <tbody>
              {sortedTickers.map((ticker) => {
                const quote = quotes[ticker];
                const isPositive = quote ? quote.dp >= 0 : true;

                return (
                  <tr
                    key={ticker}
                    className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)]"
                  >
                    <td className="mono py-1.5 font-semibold text-[var(--text-primary)]">
                      {ticker}
                    </td>
                    <td className="tabular-nums py-1.5 text-right text-[var(--text-primary)]">
                      {quote ? formatCurrency(quote.c) : "—"}
                    </td>
                    <td
                      className={`tabular-nums py-1.5 text-right ${
                        quote
                          ? isPositive
                            ? "text-[var(--accent-green)]"
                            : "text-[var(--accent-red)]"
                          : "text-[var(--text-muted)]"
                      }`}
                    >
                      {quote
                        ? `${isPositive ? "+" : ""}${formatPercent(quote.dp)}`
                        : "—"}
                    </td>
                    <td className="tabular-nums py-1.5 text-right text-[var(--text-secondary)]">
                      {quote ? formatCurrency(quote.h) : "—"}
                    </td>
                    <td className="tabular-nums py-1.5 text-right text-[var(--text-secondary)]">
                      {quote ? formatCurrency(quote.l) : "—"}
                    </td>
                    <td className="tabular-nums py-1.5 text-right text-[var(--text-muted)]">
                      {quote?.v
                        ? `${(quote.v / 1000000).toFixed(1)}M`
                        : "—"}
                    </td>
                    <td>
                      <button
                        onClick={() => removeTicker(ticker)}
                        className="text-[var(--text-muted)] hover:text-[var(--accent-red)]"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </WidgetBase>
  );
}
