import { WIDGET_DEFINITIONS, type WidgetConfig } from "../widgetConfig";
import type { Holding } from "../models";
export function text(value: unknown, max = 100): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error("Invalid text value.");
  return value.trim();
}
export function widgets(value: unknown): WidgetConfig[] {
  if (!Array.isArray(value) || value.length > 100) throw new Error("Invalid widget list.");
  const ids = new Set();
  for (const w of value) {
    if (!w || typeof w !== "object" || typeof w.id !== "string" || w.id.length > 150 || ids.has(w.id)
      || !Object.hasOwn(WIDGET_DEFINITIONS, w.type)) throw new Error("Invalid widget.");
    ids.add(w.id);
    for (const field of ["x", "y", "w", "h"]) {
      if (!Number.isInteger(w[field]) || w[field] < (field === "w" || field === "h" ? 1 : 0) || w[field] > 10000)
        throw new Error("Invalid widget dimensions.");
    }
    if (!w.settings || typeof w.settings !== "object" || Array.isArray(w.settings)) throw new Error("Invalid widget settings.");
  }
  return value as WidgetConfig[];
}
export function holdings(value: unknown): Holding[] {
  if (!Array.isArray(value) || value.length > 500) throw new Error("Invalid holdings.");
  const ids = new Set();
  for (const h of value) {
    if (!h || typeof h.id !== "string" || h.id.length > 150 || ids.has(h.id) || typeof h.ticker !== "string"
      || h.ticker.length > 30 || !Number.isFinite(h.quantity) || h.quantity < 0 || !Number.isFinite(h.avgCost) || h.avgCost < 0)
      throw new Error("Invalid holding.");
    ids.add(h.id);
  }
  return value;
}
