"use client";

import { X } from "lucide-react";
import { WIDGET_DEFINITIONS, type WidgetType } from "@/lib/widgetConfig";

type AddWidgetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (type: WidgetType) => void;
};

export default function AddWidgetModal({
  isOpen,
  onClose,
  onAdd,
}: AddWidgetModalProps) {
  if (!isOpen) return null;

  // All widgets are always available — users can add multiple of the same type
  const allWidgets = Object.entries(WIDGET_DEFINITIONS);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Add Widget
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              Choose a widget to add to your dashboard. You can add multiples of the same type.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-[var(--bg-secondary)]"
          >
            <X className="h-5 w-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {allWidgets.map(([type, def]) => (
            <button
              key={type}
              onClick={() => {
                onAdd(type as WidgetType);
                onClose();
              }}
              className="group rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4 text-left transition-all hover:border-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/5"
            >
              <div className="mb-2 text-2xl">{def.icon}</div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                {def.name}
              </div>
              <div className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                {def.description}
              </div>
              {def.tag && (
                <span className="mt-2 inline-block rounded-full bg-[var(--accent-blue)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--accent-blue)]">
                  {def.tag}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
