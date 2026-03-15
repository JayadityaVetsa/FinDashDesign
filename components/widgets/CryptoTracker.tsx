"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ApiClient } from "@/lib/apiClient";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import WidgetBase from "@/components/widgets/WidgetBase";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";

type CryptoTrackerProps = {
  apiKey: string;
  onClose?: () => void;
};

const DEFAULT_CRYPTOS = [
  { symbol: "BINANCE:BTCUSDT", display: "BTC", name: "Bitcoin" },
  { symbol: "BINANCE:ETHUSDT", display: "ETH", name: "Ethereum" },
  { symbol: "BINANCE:SOLUSDT", display: "SOL", name: "Solana" },
  { symbol: "BINANCE:XRPUSDT", display: "XRP", name: "XRP" },
  { symbol: "BINANCE:DOGEUSDT", display: "DOGE", name: "Dogecoin" },
  { symbol: "BINANCE:ADAUSDT", display: "ADA", name: "Cardano" },
];

type CryptoItem = {
  symbol: string;
  display: string;
  name: string;
};

export default function CryptoTracker({ apiKey, onClose }: CryptoTrackerProps) {
  const [cryptos, setCryptos] = useState<CryptoItem[]>(DEFAULT_CRYPTOS);
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");
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

  const loadData = useCallback(async () => {
    if (!clientRef.current || cryptos.length === 0) return;

    setLoading(true);
    try {
      const results = await Promise.all(
        cryptos.map(async (crypto) => {
          try {
            const quote = await clientRef.current!.getQuote(crypto.symbol);
            return { symbol: crypto.symbol, quote };
          } catch {
            return { symbol: crypto.symbol, quote: null };
          }
        })
      );

      const quotesMap: Record<string, any> = {};
      results.forEach((result) => {
        if (result.quote) {
          quotesMap[result.symbol] = result.quote;
        }
      });
      setQuotes(quotesMap);
    } finally {
      setLoading(false);
    }
  }, [cryptos]);

  useEffect(() => {
    if (apiKey) {
      loadData();
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [apiKey, loadData]);

  const addCrypto = () => {
    const sym = newSymbol.trim().toUpperCase();
    if (!sym) return;
    const binanceSymbol = sym.includes(":") ? sym : `BINANCE:${sym}USDT`;
    const displaySym = sym.replace("USDT", "").replace("BINANCE:", "");
    if (!cryptos.find((c) => c.symbol === binanceSymbol)) {
      setCryptos([...cryptos, { symbol: binanceSymbol, display: displaySym, name: displaySym }]);
    }
    setNewSymbol("");
  };

  const removeCrypto = (symbol: string) => {
    setCryptos(cryptos.filter((c) => c.symbol !== symbol));
  };

  return (
    <WidgetBase title="Crypto Tracker" onClose={onClose}>
      <div ref={containerRef} className="flex h-full flex-col">
        {/* Add input */}
        <div className="mb-2 flex gap-2">
          <input
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && addCrypto()}
            className="mono flex-1 rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1 text-xs uppercase outline-none focus:border-[var(--accent-blue)]"
            placeholder="BTC, ETH, SOL..."
          />
          <button
            onClick={addCrypto}
            className="flex items-center rounded border border-[var(--border)] bg-[var(--accent-blue)] px-2 py-1 text-xs text-white"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Crypto list */}
        <div className="flex-1 space-y-1.5 overflow-y-auto">
          {cryptos.map((crypto) => {
            const quote = quotes[crypto.symbol];
            const isPositive = quote ? quote.dp >= 0 : true;

            return (
              <div
                key={crypto.symbol}
                className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-2 transition-colors hover:bg-[var(--bg-card-hover)]"
              >
                {containerWidth >= 200 && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-amber)]/15 text-xs font-bold text-[var(--accent-amber)]">
                    {crypto.display.slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="mono text-xs font-semibold text-[var(--text-primary)]">
                      {crypto.display}
                    </span>
                    {containerWidth >= 250 && (
                      <span className="truncate text-[10px] text-[var(--text-muted)]">
                        {crypto.name}
                      </span>
                    )}
                  </div>
                  {loading && !quote ? (
                    <div className="skeleton mt-0.5 h-3 w-20" />
                  ) : quote ? (
                    <div className="flex items-center gap-1">
                      <span className="tabular-nums text-xs font-medium text-[var(--text-primary)]">
                        {formatCurrency(quote.c)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-[var(--text-muted)]">No data</span>
                  )}
                </div>
                {quote && (
                  <div className="flex items-center gap-1 text-right">
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 text-[var(--accent-green)]" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-[var(--accent-red)]" />
                    )}
                    <span
                      className={`tabular-nums text-xs font-semibold ${
                        isPositive ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {formatPercent(quote.dp)}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => removeCrypto(crypto.symbol)}
                  className="ml-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent-red)]"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </WidgetBase>
  );
}
