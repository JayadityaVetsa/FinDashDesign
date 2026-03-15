"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle } from "lucide-react";

type Toast = {
  id: string;
  message: string;
  type: "error" | "info" | "success";
  duration?: number;
};

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notify(toast: Omit<Toast, "id">) {
  const id = crypto.randomUUID();
  const newToast: Toast = { ...toast, id };
  toasts = [...toasts, newToast];
  toastListeners.forEach((listener) => listener([...toasts]));

  const duration = toast.duration ?? 5000;
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }
}

function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  toastListeners.forEach((listener) => listener([...toasts]));
}

export function showToast(toast: Omit<Toast, "id">) {
  notify(toast);
}

export function showRateLimitToast(retryAfter: number) {
  let remaining = retryAfter;
  const id = crypto.randomUUID();
  
  const updateToast = () => {
    const existing = toasts.find((t) => t.id === id);
    if (existing) {
      const updated = {
        ...existing,
        message: `Rate limit reached — refreshing in ${remaining}s`,
      };
      toasts = toasts.map((t) => (t.id === id ? updated : t));
      toastListeners.forEach((listener) => listener([...toasts]));
    } else {
      const newToast: Toast = {
        id,
        message: `Rate limit reached — refreshing in ${remaining}s`,
        type: "error",
        duration: 0, // Don't auto-dismiss
      };
      toasts = [...toasts, newToast];
      toastListeners.forEach((listener) => listener([...toasts]));
    }

    if (remaining > 0) {
      remaining--;
      setTimeout(updateToast, 1000);
    } else {
      removeToast(id);
    }
  };

  updateToast();
}

export default function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setCurrentToasts(newToasts);
    };
    toastListeners.push(listener);
    setCurrentToasts([...toasts]);

    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  if (currentToasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {currentToasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg ${
            toast.type === "error"
              ? "border-[var(--accent-red)] bg-[var(--bg-card)] text-[var(--accent-red)]"
              : toast.type === "success"
              ? "border-[var(--accent-green)] bg-[var(--bg-card)] text-[var(--accent-green)]"
              : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)]"
          }`}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
