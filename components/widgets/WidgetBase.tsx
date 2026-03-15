"use client";

import { useState } from "react";
import { GripVertical, Settings, X } from "lucide-react";

type WidgetBaseProps = {
  title: string;
  children: React.ReactNode;
  onSettings?: () => void;
  onClose?: () => void;
  className?: string;
};

export default function WidgetBase({
  title,
  children,
  onSettings,
  onClose,
  className = "",
}: WidgetBaseProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`group card h-full flex flex-col ${className}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header with drag handle */}
      <div className="widget-handle flex items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-2">
        <div className="flex items-center gap-2">
          <GripVertical className="h-3.5 w-3.5 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-50" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {title}
          </h3>
        </div>
        <div
          className={`flex items-center gap-1 transition-opacity ${
            showActions ? "opacity-100" : "opacity-0"
          }`}
        >
          {onSettings && (
            <button
              onClick={onSettings}
              className="rounded p-1 hover:bg-[var(--bg-secondary)]"
              title="Settings"
            >
              <Settings className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="rounded p-1 hover:bg-[var(--accent-red)]/20 hover:text-[var(--accent-red)]"
              title="Remove widget"
            >
              <X className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">{children}</div>
    </div>
  );
}
