"use client";

import { useEffect, useState, useRef } from "react";
import { ApiClient } from "@/lib/apiClient";
import WidgetBase from "@/components/widgets/WidgetBase";

type EarningsCalendarProps = {
  apiKey: string;
  onClose?: () => void;
};

export default function EarningsCalendar({ apiKey, onClose }: EarningsCalendarProps) {
  const [earnings, setEarnings] = useState<any[]>([]);
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
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      const data = await clientRef.current.getEarningsCalendar(
        today.toISOString().split("T")[0],
        nextWeek.toISOString().split("T")[0]
      );
      
      // Sort by date and limit to this week
      const sorted = data
        .filter((e) => {
          const earningsDate = new Date(e.date);
          return earningsDate >= today && earningsDate <= nextWeek;
        })
        .sort((a, b) => (a.date > b.date ? 1 : -1))
        .slice(0, 10);
      
      setEarnings(sorted);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      loadData();
    }
  }, [apiKey]);

  const isToday = (date: string) => {
    const today = new Date().toISOString().split("T")[0];
    return date === today;
  };

  return (
    <WidgetBase title="Earnings Calendar" onClose={onClose}>
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-1.5 overflow-y-auto pr-1 min-h-0">
          {loading && (
            <div className="space-y-1.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-16 w-full rounded-lg" />
              ))}
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-[var(--accent-red)]/10 px-2 py-1 text-xs text-[var(--accent-red)]">
              {error}
            </div>
          )}
          {!loading && !error && earnings.length === 0 && (
            <div className="py-4 text-center text-xs text-[var(--text-secondary)]">
              No earnings scheduled this week
            </div>
          )}
          {earnings.map((earning, idx) => (
            <div
              key={`${earning.symbol}-${earning.date}-${idx}`}
              className={`rounded-lg border p-2 ${
                isToday(earning.date)
                  ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                  : "border-[var(--border)] bg-[var(--bg-card)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="mono text-sm font-semibold text-[var(--text-primary)]">
                    {earning.symbol}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {new Date(earning.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase text-[var(--text-muted)]">
                    {earning.hour || "—"}
                  </div>
                  {earning.epsEstimate && (
                    <div className="text-xs text-[var(--text-secondary)]">
                      EPS: {earning.epsEstimate}
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
