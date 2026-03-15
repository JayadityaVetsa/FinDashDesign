"use client";

import { useEffect, useState, useRef } from "react";
import { ApiClient } from "@/lib/apiClient";
import WidgetBase from "@/components/widgets/WidgetBase";
import { Rocket } from "lucide-react";

type IPOCalendarProps = {
  apiKey: string;
  onClose?: () => void;
};

export default function IPOCalendar({ apiKey, onClose }: IPOCalendarProps) {
  const [ipos, setIpos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<ApiClient | null>(null);

  useEffect(() => {
    if (apiKey) {
      clientRef.current = new ApiClient({ apiKey });
    }
  }, [apiKey]);

  const loadData = async () => {
    if (!clientRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setDate(today.getDate() + 30);

      const data = await clientRef.current.getIPOCalendar(
        today.toISOString().split("T")[0],
        nextMonth.toISOString().split("T")[0]
      );

      const sorted = data
        .sort((a, b) => (a.date > b.date ? 1 : -1))
        .slice(0, 15);

      setIpos(sorted);
    } catch (err: any) {
      if (err.message?.includes("ACCESS_DENIED")) {
        setError("IPO calendar may require a premium plan.");
      } else {
        setError(err.message || "Failed to load IPO data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      loadData();
    }
  }, [apiKey]);

  const formatValue = (val: number) => {
    if (!val) return "—";
    if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(0)}M`;
    return `$${val.toLocaleString()}`;
  };

  return (
    <WidgetBase title="IPO Calendar" onClose={onClose}>
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-1.5 overflow-y-auto min-h-0">
          {loading && (
            <div className="space-y-1.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-14 w-full rounded-lg" />
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-[var(--accent-amber)]/10 border border-[var(--accent-amber)]/20 px-2 py-1 text-xs text-[var(--accent-amber)]">
              {error}
            </div>
          )}

          {!loading && !error && ipos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Rocket className="mb-2 h-6 w-6 text-[var(--text-muted)]" />
              <div className="text-xs text-[var(--text-secondary)]">
                No upcoming IPOs in the next 30 days
              </div>
            </div>
          )}

          {ipos.map((ipo, idx) => (
            <div
              key={`${ipo.symbol || ipo.name}-${idx}`}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-2 transition-colors hover:bg-[var(--bg-card-hover)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {ipo.symbol && (
                      <span className="mono text-xs font-semibold text-[var(--accent-blue)]">
                        {ipo.symbol}
                      </span>
                    )}
                    <span className="truncate text-xs font-medium text-[var(--text-primary)]">
                      {ipo.name}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                    <span>
                      {new Date(ipo.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {ipo.exchange && (
                      <>
                        <span>•</span>
                        <span>{ipo.exchange}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {ipo.price && ipo.price !== "0" && (
                    <div className="text-xs font-medium text-[var(--text-primary)]">
                      {ipo.price.includes("-") ? `$${ipo.price}` : `$${ipo.price}`}
                    </div>
                  )}
                  {ipo.totalSharesValue > 0 && (
                    <div className="text-[10px] text-[var(--text-muted)]">
                      {formatValue(ipo.totalSharesValue)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WidgetBase>
  );
}
