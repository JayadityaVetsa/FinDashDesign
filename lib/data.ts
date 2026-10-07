import { apiRequest } from "./httpClient";
import type { UserProfile, StoredDashboard } from "./models";
import type { WidgetConfig } from "./widgetConfig";
export type { UserProfile, Holding, StoredDashboard } from "./models";
// The server derives ownership exclusively from the HttpOnly session cookie.
export const getProfile = (userId: string) => { if (!userId) throw new Error("Sign in first."); return apiRequest<UserProfile>("workspace?resource=profile", "GET", undefined, userId); };
export const getUserDashboards = (userId: string) => { if (!userId) throw new Error("Sign in first."); return apiRequest<StoredDashboard[]>("workspace?resource=dashboards", "GET", undefined, userId); };
export const updateProfile = (userId: string, updates: Partial<Omit<UserProfile, "id" | "created_at" | "updated_at">>) =>
  apiRequest("workspace", "POST", { action: "profile", updates }, userId);
export const createDashboard = (userId: string, name: string, widgets: WidgetConfig[] = [], position = 0) =>
  apiRequest<StoredDashboard>("workspace", "POST", { action: "create", name, widgets, position }, userId);
export const updateDashboard = (id: string, updates: Partial<Pick<StoredDashboard, "name" | "widgets" | "position">>) =>
  apiRequest("workspace", "POST", { action: "update", id, updates });
export const deleteDashboard = (id: string) => apiRequest("workspace", "POST", { action: "delete", id });
export const seedDashboards = (userId: string, seeds: { name: string; widgets: WidgetConfig[] }[], finnhubKey?: string) =>
  apiRequest<StoredDashboard[]>("workspace", "POST", { action: "initialize", seeds, finnhubKey }, userId);
