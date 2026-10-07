"use client";
import { useSyncExternalStore } from "react";
import { X, AlertCircle } from "lucide-react";
type Toast = { id: string; message: string; type: "error" | "info" | "success"; duration?: number };
const listeners = new Set<() => void>();
let toasts: Toast[] = [];
const empty: Toast[] = [];
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const notify = () => listeners.forEach(fn => fn());
function removeToast(id: string) { toasts = toasts.filter(t => t.id !== id); notify(); }
export function showToast(toast: Omit<Toast, "id">) {
  const id = crypto.randomUUID();
  toasts = [...toasts.slice(-3), { ...toast, id }]; notify();
  const duration = toast.duration ?? 6000;
  if (duration > 0) setTimeout(() => removeToast(id), duration);
}
let rateLimitUntil = 0;
export function showRateLimitToast(seconds: number) {
  if (Date.now() < rateLimitUntil) return;
  rateLimitUntil = Date.now() + seconds * 1000;
  showToast({ type: "info", message: `Market data rate limit reached. Retry in ${seconds} seconds.`, duration: seconds * 1000 });
}
export default function ToastContainer() {
  const current = useSyncExternalStore(subscribe, () => toasts, () => empty);
  return <div aria-live="polite" className="fixed bottom-20 right-4 left-4 sm:left-auto z-[60] flex max-w-lg flex-col gap-2">
    {current.map(toast => <div key={toast.id} className={`flex items-center gap-3 rounded-lg border bg-[var(--bg-card)] px-4 py-3 shadow-lg ${toast.type === "error" ? "border-[var(--accent-red)] text-[var(--accent-red)]" : "border-[var(--border)]"}`}>
      <AlertCircle className="h-4 w-4 shrink-0" /><span className="text-sm">{toast.message}</span>
      <button onClick={() => removeToast(toast.id)} aria-label="Dismiss notification"><X className="h-4 w-4" /></button>
    </div>)}
  </div>;
}
