"use client";

import { useEffect, useState, useRef } from "react";
import { ApiClient } from "@/lib/apiClient";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import WidgetBase from "@/components/widgets/WidgetBase";

type TechnicalIndicatorsProps = {
  apiKey: string;
  ticker?: string;
  onClose?: () => void;
  onTickerChange?: (ticker: string) => void;
};

export default function TechnicalIndicators({
  apiKey,
  ticker: initialTicker = "AAPL",
  onClose,
  onTickerChange,
}: TechnicalIndicatorsProps) {
  const [ticker, setTicker] = useState(initialTicker);
  const [isEditing, setIsEditing] = useState(false);
  const [financials, setFinancials] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(400);
  const containerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<ApiClient | null>(null);

  useEffect(() => {
    if (apiKey) {
      clientRef.current = new ApiClient({ apiKey });
    }
  }, [apiKey]);

  // Observe container width
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

  const loadData = async () => {
    if (!clientRef.current || !ticker.trim()) return;
    
    setLoading(true);
    setError(null);
    
    const symbol = ticker.trim().toUpperCase();
    
    try {
      const financialsData = await clientRef.current.getBasicFinancials(symbol);
      setFinancials(financialsData);
    } catch (err: any) {
      if (err.message?.includes("ACCESS_DENIED")) {
        setError("Basic financials require premium API access.");
      }
    }
    
    try {
      const profileData = await clientRef.current.getCompanyProfile(symbol);
      setProfile(profileData);
    } catch {
      // Profile is optional
    }
    
    setLoading(false);
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

  const metric = financials?.metric || {};
  const marketCap = profile?.marketCapitalization || metric.marketCapitalization || 0;

  const indicators = [
    { label: "52W High", value: metric["52WeekHigh"] ? formatCurrency(metric["52WeekHigh"]) : "—" },
    { label: "52W Low", value: metric["52WeekLow"] ? formatCurrency(metric["52WeekLow"]) : "—" },
    { label: "P/E Ratio", value: metric.peAnnual ? metric.peAnnual.toFixed(2) : "—" },
    { label: "EPS", value: metric.epsAnnual ? formatCurrency(metric.epsAnnual) : "—" },
    { label: "Market Cap", value: marketCap ? `$${(marketCap / 1000).toFixed(1)}B` : "—" },
    { label: "Div Yield", value: metric.dividendYieldIndicatedAnnual ? formatPercent(metric.dividendYieldIndicatedAnnual) : "—" },
    { label: "Beta", value: metric.beta ? metric.beta.toFixed(2) : "—" },
    { label: "P/B", value: metric.priceToBookAnnual ? metric.priceToBookAnnual.toFixed(2) : "—" },
  ];

  // Responsive grid: 1 col when very narrow, 2 otherwise
  const gridCols = containerWidth < 250 ? "grid-cols-1" : "grid-cols-2";

  return (
    <WidgetBase title={`${ticker} — Technicals`} onClose={onClose}>
      <div ref={containerRef} className="flex h-full flex-col">
        {/* Ticker edit */}
        <div className="mb-3">
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

        {loading && (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-12 w-full rounded-lg" />
            ))}
          </div>
        )}
        {error && !loading && (
          <div className="rounded-lg bg-[var(--accent-amber)]/10 border border-[var(--accent-amber)]/20 px-2 py-1 text-xs text-[var(--accent-amber)]">
            {error}
          </div>
        )}
        {!loading && (
          <div className={`grid ${gridCols} gap-2`}>
            {indicators.map((indicator, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-2"
              >
                <div className="text-[10px] text-[var(--text-muted)]">
                  {indicator.label}
                </div>
                <div className="tabular-nums text-sm font-semibold text-[var(--text-primary)]">
                  {indicator.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetBase>
  );
}
