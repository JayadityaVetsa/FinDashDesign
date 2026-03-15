"use client";

import { useState, useEffect } from "react";
import { Search, Key, Sun, Moon, LogOut } from "lucide-react";
import APIKeyIndicator from "@/components/APIKeyIndicator";
import CommandPalette from "@/components/CommandPalette";

type HeaderProps = {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onApiKeyCommit?: (key: string) => void;
  onSignOut: () => void;
  onStockSelect?: (symbol: string) => void;
};

export default function Header({
  apiKey,
  onApiKeyChange,
  onApiKeyCommit,
  onSignOut,
  onStockSelect,
}: HeaderProps) {
  const [showKey, setShowKey] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Initialize theme
  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsDark(document.documentElement.classList.contains("dark"));
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("findash-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("findash-theme", "light");
    }
  };

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 h-[52px] border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="mx-auto flex h-full max-w-[1920px] items-center justify-between gap-4 px-4">
          {/* Left: Logo with status indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-blue)] text-sm font-bold text-white">
                F
              </div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                FinDash
              </span>
            </div>
            <APIKeyIndicator apiKey={apiKey} />
          </div>

          {/* Center: Global search */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex flex-1 max-w-md items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-left text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--border-active)]"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1">Search stocks...</span>
            <kbd className="hidden rounded bg-[var(--bg-secondary)] px-1.5 py-0.5 text-xs sm:inline">
              ⌘K
            </kbd>
          </button>

          {/* Right: API key, theme, sign out */}
          <div className="flex items-center gap-2">
            {/* API Key input */}
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1">
              <Key className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                className="w-36 bg-transparent text-xs outline-none placeholder:text-[var(--text-muted)]"
                placeholder="Enter Finnhub API key"
                onBlur={() => {
                  onApiKeyCommit?.(apiKey);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    (e.target as HTMLInputElement).blur();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-active)] hover:text-[var(--text-primary)]"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {/* Sign out */}
            <button
              onClick={onSignOut}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-red)] hover:text-[var(--accent-red)]"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelect={(symbol) => {
          onStockSelect?.(symbol);
          setCommandPaletteOpen(false);
        }}
        apiKey={apiKey}
      />
    </>
  );
}
