"use client";

import { X } from "lucide-react";
import { WIDGET_DEFINITIONS, type WidgetType } from "@/lib/widgetConfig";

type AddWidgetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (type: WidgetType) => void;
  existingTypes: WidgetType[];
};

export default function AddWidgetModal({
  isOpen,
  onClose,
  onAdd,
  existingTypes,
}: AddWidgetModalProps) {
  if (!isOpen) return null;

  const availableWidgets = Object.entries(WIDGET_DEFINITIONS).filter(
    ([type]) => !existingTypes.includes(type as WidgetType)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Add Widget
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-[var(--bg-secondary)]"
          >
            <X className="h-5 w-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {availableWidgets.map(([type, def]) => (
            <button
              key={type}
              onClick={() => {
                onAdd(type as WidgetType);
                onClose();
              }}
              className="group rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 text-left transition-all hover:border-[var(--accent-blue)] hover:bg-[var(--bg-card-hover)]"
            >
              <div className="mb-2 text-2xl">{def.icon}</div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                {def.name}
              </div>
              <div className="mt-1 text-xs text-[var(--text-secondary)]">
                {def.description}
              </div>
            </button>
          ))}
        </div>

        {availableWidgets.length === 0 && (
          <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
            All available widgets have been added
          </div>
        )}
      </div>
    </div>
  );
}
