"use client";

import { useEffect, useState, useRef } from "react";
import { ApiClient } from "@/lib/apiClient";
import { formatPercent } from "@/lib/formatters";
import WidgetBase from "@/components/widgets/WidgetBase";

type SectorHeatmapProps = {
  apiKey: string;
  onClose?: () => void;
};

const SECTORS = [
  { symbol: "XLK", name: "Technology" },
  { symbol: "XLF", name: "Finance" },
  { symbol: "XLE", name: "Energy" },
  { symbol: "XLV", name: "Healthcare" },
  { symbol: "XLY", name: "Consumer Disc." },
  { symbol: "XLI", name: "Industrial" },
  { symbol: "XLB", name: "Materials" },
  { symbol: "XLU", name: "Utilities" },
  { symbol: "XLRE", name: "Real Estate" },
];

export default function SectorHeatmap({ apiKey, onClose }: SectorHeatmapProps) {
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
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
    if (!clientRef.current) return;
    
    setLoading(true);
    try {
      const results = await Promise.all(
        SECTORS.map(async (sector) => {
          try {
            const quote = await clientRef.current!.getQuote(sector.symbol);
            return { symbol: sector.symbol, quote };
          } catch {
            return null;
          }
        })
      );

      const quotesMap: Record<string, any> = {};
      results.forEach((result) => {
        if (result) {
          quotesMap[result.symbol] = result.quote;
        }
      });
      
      setQuotes(quotesMap);
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

  const getColor = (changePercent: number) => {
    if (changePercent >= 2) return "bg-[var(--accent-green)]";
    if (changePercent >= 1) return "bg-[var(--accent-green)]/70";
    if (changePercent >= 0) return "bg-[var(--accent-green)]/40";
    if (changePercent >= -1) return "bg-[var(--accent-red)]/40";
    if (changePercent >= -2) return "bg-[var(--accent-red)]/70";
    return "bg-[var(--accent-red)]";
  };

  // Responsive: 2 cols when narrow, 3 cols otherwise
  const gridCols = containerWidth < 280 ? "grid-cols-2" : "grid-cols-3";

  return (
    <WidgetBase title="Sector Heatmap" onClose={onClose}>
      <div ref={containerRef} className={`grid ${gridCols} gap-2`}>
        {SECTORS.map((sector) => {
          const quote = quotes[sector.symbol];
          const changePercent = quote?.dp || 0;
          const colorClass = getColor(changePercent);

          return (
            <div
              key={sector.symbol}
              className={`${colorClass} flex flex-col items-center justify-center rounded-lg p-2 text-center transition-transform hover:scale-105`}
            >
              <div className="mono text-[11px] font-semibold text-white">
                {sector.symbol}
              </div>
              <div className="text-[9px] leading-tight text-white/80">{sector.name}</div>
              {loading && !quote ? (
                <div className="skeleton mt-1 h-4 w-12 bg-white/20" />
              ) : quote ? (
                <div className="mt-0.5 text-xs font-semibold text-white">
                  {changePercent >= 0 ? "+" : ""}
                  {formatPercent(changePercent)}
                </div>
              ) : (
                <div className="mt-1 text-xs text-white/60">—</div>
              )}
            </div>
          );
        })}
      </div>
    </WidgetBase>
  );
}
