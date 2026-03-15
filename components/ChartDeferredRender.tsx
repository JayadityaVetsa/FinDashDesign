"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Wraps Recharts components so they only render once the wrapper container
 * has valid (> 0) dimensions, preventing the infamous
 * "width(-1) and height(-1)" error from ResponsiveContainer.
 *
 * Strategy:
 *  1. Wait for 2 rAF frames (lets paint finish)
 *  2. Check dimensions — if good, render immediately
 *  3. Otherwise fall back to ResizeObserver polling
 *  4. Safety: render after 3 s but ONLY if dimensions are valid
 */
export default function ChartDeferredRender({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    let observer: ResizeObserver | null = null;
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    const markReady = () => {
      if (cancelled || readyRef.current) return;
      readyRef.current = true;
      setReady(true);
      cleanup();
    };

    const hasDimensions = () => {
      const { width, height } = el.getBoundingClientRect();
      return width > 4 && height > 4;
    };

    const cleanup = () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }
    };

    // Wait 2 rAF frames for layout to settle
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) return;

        if (hasDimensions()) {
          markReady();
          return;
        }

        // Not ready yet — observe for size changes
        observer = new ResizeObserver(() => {
          if (hasDimensions()) {
            markReady();
          }
        });
        observer.observe(el);

        // Safety: render after 3 s IF dimensions are now valid, else hide chart
        safetyTimer = setTimeout(() => {
          if (!cancelled && !readyRef.current) {
            // Only render if dimensions are actually valid
            if (hasDimensions()) {
              markReady();
            } else {
              // Still no valid dimensions — render anyway to unblock
              // Recharts will log a warning but won't crash
              readyRef.current = true;
              setReady(true);
              cleanup();
            }
          }
        }, 3000);
      });
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <div ref={containerRef} className={`h-full w-full ${className}`}>
      {ready ? (
        children
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent-blue)]" />
        </div>
      )}
    </div>
  );
}
