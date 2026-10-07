"use client";

import { useState, useEffect } from "react";
import { Key, Sun, Moon, LogOut, PanelLeftClose, PanelLeft, Search, RefreshCw } from "lucide-react";
import APIKeyIndicator from "@/components/APIKeyIndicator";

type HeaderProps = {
  apiKey: string;
  validatedApiKey?: string;
  onSearch?: () => void;
  onRefresh?: () => void;
  onApiKeyChange: (key: string) => void;
  onApiKeyCommit?: (key: string) => void;
  onSignOut: () => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
  onThemeChange?: (theme: string) => void;
};

export default function Header({
  apiKey,
  validatedApiKey,
  onSearch,
  onRefresh,
  onApiKeyChange,
  onApiKeyCommit,
  onSignOut,
  onToggleSidebar,
  sidebarCollapsed,
  onThemeChange,
}: HeaderProps) {
  const [showKey, setShowKey] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Initialize theme
  useEffect(() => {
    if (typeof document !== "undefined") {
      const observer = new MutationObserver(() => setIsDark(document.documentElement.classList.contains("dark")));
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      const frame = requestAnimationFrame(() => setIsDark(document.documentElement.classList.contains("dark")));
      return () => { observer.disconnect(); cancelAnimationFrame(frame); };
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    const themeName = next ? "dark" : "light";
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try { localStorage.setItem("findash-theme", themeName); } catch { /* unavailable */ }
    onThemeChange?.(themeName);
  };

  return (
    <header className="sticky top-0 z-40 h-[52px] border-b border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="flex h-full w-full items-center justify-between gap-4 px-4">
        {/* Left: Sidebar toggle + Logo */}
        <div className="flex items-center gap-2">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-blue)] text-sm font-bold text-white">
              F
            </div>
            <span className="hidden sm:inline text-sm font-semibold text-[var(--text-primary)]">
              FinDash
            </span>
          </div>
          <APIKeyIndicator apiKey={validatedApiKey ?? apiKey} />
        </div>

        {/* Right: API key, theme, sign out */}
        <div className="flex items-center gap-2">
          <button onClick={onSearch} aria-label="Search stocks" title="Search stocks (Ctrl/⌘ K)" className="p-2"><Search className="h-4 w-4" /></button>
          <button onClick={onRefresh} aria-label="Refresh market data" className="p-2"><RefreshCw className="h-4 w-4" /></button>
          {/* API Key input */}
          <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1">
            <Key className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              aria-label="Finnhub API key"
              className="w-12 sm:w-36 bg-transparent text-xs outline-none placeholder:text-[var(--text-muted)]"
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
            aria-label="Toggle color theme"
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
            aria-label="Sign out"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-red)] hover:text-[var(--accent-red)]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
