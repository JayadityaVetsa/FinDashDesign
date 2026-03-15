"use client";

import { useEffect, useState, useRef } from "react";
import { Search, X } from "lucide-react";
import { ApiClient } from "@/lib/apiClient";
import type { FinnhubSearchResult } from "@/lib/finnhub";

type CommandPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
  apiKey: string;
};

export default function CommandPalette({
  isOpen,
  onClose,
  onSelect,
  apiKey,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FinnhubSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!apiKey || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const client = new ApiClient({ apiKey });
        const searchResults = await client.searchSymbol(query.trim());
        setResults(searchResults.slice(0, 10)); // Limit to 10 results
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(search, 300);
    return () => clearTimeout(timeout);
  }, [query, apiKey]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        onSelect(results[selectedIndex].symbol);
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, results]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <Search className="h-5 w-5 text-[var(--text-secondary)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stocks by name or ticker..."
            className="flex-1 bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-[var(--bg-secondary)]"
          >
            <X className="h-4 w-4 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Results */}
        <div
          ref={resultsRef}
          className="max-h-96 overflow-y-auto"
        >
          {loading && (
            <div className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
              Searching...
            </div>
          )}

          {!loading && query.trim().length < 2 && (
            <div className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
              Type at least 2 characters to search
            </div>
          )}

          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
              No results found
            </div>
          )}

          {results.map((result, index) => (
            <button
              key={`${result.symbol}-${index}`}
              onClick={() => {
                onSelect(result.symbol);
                onClose();
              }}
              className={`w-full px-4 py-3 text-left transition-colors ${
                index === selectedIndex
                  ? "bg-[var(--accent-blue)]/20"
                  : "hover:bg-[var(--bg-secondary)]"
              }`}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                    {result.symbol}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {result.description}
                  </div>
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {result.type}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--text-muted)]">
          <kbd className="rounded bg-[var(--bg-secondary)] px-2 py-0.5">↑</kbd>{" "}
          <kbd className="rounded bg-[var(--bg-secondary)] px-2 py-0.5">↓</kbd>{" "}
          to navigate • <kbd className="rounded bg-[var(--bg-secondary)] px-2 py-0.5">Enter</kbd>{" "}
          to select • <kbd className="rounded bg-[var(--bg-secondary)] px-2 py-0.5">Esc</kbd>{" "}
          to close
        </div>
      </div>
    </div>
  );
}
