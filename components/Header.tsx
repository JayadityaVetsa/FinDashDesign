"use client";

import { useState, useEffect } from "react";
import { Key, Sun, Moon, LogOut, PanelLeftClose, PanelLeft } from "lucide-react";
import APIKeyIndicator from "@/components/APIKeyIndicator";

type HeaderProps = {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onApiKeyCommit?: (key: string) => void;
  onSignOut: () => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
};

export default function Header({
  apiKey,
  onApiKeyChange,
  onApiKeyCommit,
  onSignOut,
  onToggleSidebar,
  sidebarCollapsed,
}: HeaderProps) {
  const [showKey, setShowKey] = useState(false);
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

  return (
    <header className="sticky top-0 z-40 h-[52px] border-b border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="mx-auto flex h-full max-w-[1920px] items-center justify-between gap-4 px-4">
        {/* Left: Sidebar toggle + Logo */}
        <div className="flex items-center gap-2">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
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
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              FinDash
            </span>
          </div>
          <APIKeyIndicator apiKey={apiKey} />
        </div>

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
  );
}
