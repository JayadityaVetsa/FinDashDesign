"use client";

import { useEffect, useState, useRef } from "react";
import { ApiClient } from "@/lib/apiClient";
import { formatCurrency } from "@/lib/formatters";
import WidgetBase from "@/components/widgets/WidgetBase";
import { Globe, Building2, Calendar } from "lucide-react";

type CompanyProfileProps = {
  apiKey: string;
  ticker?: string;
  onClose?: () => void;
  onTickerChange?: (ticker: string) => void;
};

export default function CompanyProfile({
  apiKey,
  ticker: initialTicker = "AAPL",
  onClose,
  onTickerChange,
}: CompanyProfileProps) {
  const [ticker, setTicker] = useState(initialTicker);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [financials, setFinancials] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    if (!clientRef.current || !ticker.trim()) return;

    setLoading(true);
    setError(null);
    const symbol = ticker.trim().toUpperCase();

    try {
      const [profileData, financialsData] = await Promise.allSettled([
        clientRef.current.getCompanyProfile(symbol),
        clientRef.current.getBasicFinancials(symbol),
      ]);

      if (profileData.status === "fulfilled") {
        setProfile(profileData.value);
      } else {
        setError("Could not load company profile");
      }

      if (financialsData.status === "fulfilled") {
        setFinancials(financialsData.value);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data");
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

  const metric = financials?.metric || {};
  const marketCap = profile?.marketCapitalization || metric.marketCapitalization || 0;

  return (
    <WidgetBase title={`${ticker} — Profile`} onClose={onClose}>
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
            <div className="skeleton h-16 w-full rounded-lg" />
            <div className="skeleton h-10 w-full rounded-lg" />
            <div className="skeleton h-10 w-full rounded-lg" />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg bg-[var(--accent-red)]/10 px-2 py-1 text-xs text-[var(--accent-red)]">
            {error}
          </div>
        )}

        {!loading && profile && (
          <div className="flex-1 space-y-3 overflow-y-auto">
            {/* Company header */}
            <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
              {profile.logo && (
                <img
                  src={profile.logo}
                  alt={profile.name}
                  className="h-10 w-10 rounded-lg bg-white object-contain p-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  {profile.name}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                  <span>{profile.exchange}</span>
                  <span>•</span>
                  <span>{profile.finnhubIndustry}</span>
                </div>
              </div>
            </div>

            {/* Key info */}
            <div className={`grid ${containerWidth < 220 ? "grid-cols-1" : "grid-cols-2"} gap-2`}>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-2">
                <div className="text-[10px] text-[var(--text-muted)]">Market Cap</div>
                <div className="tabular-nums text-sm font-semibold text-[var(--text-primary)]">
                  {marketCap ? `$${(marketCap / 1000).toFixed(1)}B` : "—"}
                </div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-2">
                <div className="text-[10px] text-[var(--text-muted)]">Shares Out</div>
                <div className="tabular-nums text-sm font-semibold text-[var(--text-primary)]">
                  {profile.shareOutstanding
                    ? `${(profile.shareOutstanding / 1000).toFixed(1)}B`
                    : "—"}
                </div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-2">
                <div className="text-[10px] text-[var(--text-muted)]">Currency</div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  {profile.currency || "—"}
                </div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-2">
                <div className="text-[10px] text-[var(--text-muted)]">Country</div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  {profile.country || "—"}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 text-xs">
              {profile.ipo && (
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Calendar className="h-3 w-3" />
                  <span>IPO: {profile.ipo}</span>
                </div>
              )}
              {profile.weburl && (
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3 text-[var(--text-secondary)]" />
                  <a
                    href={profile.weburl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-[var(--accent-blue)] hover:underline"
                  >
                    {profile.weburl.replace(/^https?:\/\/(www\.)?/, "")}
                  </a>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Building2 className="h-3 w-3" />
                  <span>{profile.phone}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </WidgetBase>
  );
}
