"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ApiClient } from "@/lib/apiClient";
import WidgetBase from "@/components/widgets/WidgetBase";
import { ArrowRightLeft } from "lucide-react";

type ForexRatesProps = {
  apiKey: string;
  onClose?: () => void;
};

const CURRENCY_PAIRS = [
  { base: "USD", targets: ["EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR"] },
];

const CURRENCY_FLAGS: Record<string, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  JPY: "🇯🇵",
  CAD: "🇨🇦",
  AUD: "🇦🇺",
  CHF: "🇨🇭",
  CNY: "🇨🇳",
  INR: "🇮🇳",
};

export default function ForexRates({ apiKey, onClose }: ForexRatesProps) {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [baseCurrency, setBaseCurrency] = useState("USD");
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
      const data = await clientRef.current.getForexRates(baseCurrency);
      setRates(data.quote || {});
    } catch (err: any) {
      if (err.message?.includes("ACCESS_DENIED")) {
        setError("Forex rates require a premium plan.");
      } else {
        setError(err.message || "Failed to load forex rates");
      }
    } finally {
      setLoading(false);
    }
  }, [baseCurrency]);

  useEffect(() => {
    if (apiKey) {
      loadData();
      const interval = setInterval(loadData, 60000);
      return () => clearInterval(interval);
    }
  }, [apiKey, loadData]);

  const targets = CURRENCY_PAIRS[0].targets;
  const displayCurrencies = baseCurrency === "USD"
    ? targets
    : ["USD", ...targets.filter((t) => t !== baseCurrency)];

  return (
    <WidgetBase title="Forex Rates" onClose={onClose}>
      <div className="flex h-full flex-col">
        {/* Base currency selector */}
        <div className="mb-3 flex items-center gap-2">
          <ArrowRightLeft className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          <select
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value)}
            className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1 text-xs font-semibold outline-none"
          >
            {["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR"].map((c) => (
              <option key={c} value={c}>
                {CURRENCY_FLAGS[c]} {c}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-[var(--text-muted)]">Base</span>
        </div>

        {/* Rates */}
        <div className="flex-1 space-y-1.5 overflow-y-auto">
          {loading && (
            <div className="space-y-1.5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-10 w-full rounded-lg" />
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-[var(--accent-amber)]/10 border border-[var(--accent-amber)]/20 px-2 py-1 text-xs text-[var(--accent-amber)]">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            displayCurrencies.map((currency) => {
              const rate = rates[currency];
              return (
                <div
                  key={currency}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-2 transition-colors hover:bg-[var(--bg-card-hover)]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{CURRENCY_FLAGS[currency] || "💱"}</span>
                    <div>
                      <div className="mono text-xs font-semibold text-[var(--text-primary)]">
                        {baseCurrency}/{currency}
                      </div>
                    </div>
                  </div>
                  <div className="tabular-nums text-sm font-semibold text-[var(--text-primary)]">
                    {rate ? rate.toFixed(4) : "—"}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </WidgetBase>
  );
}
