import type { WidgetConfig } from "./widgetConfig";
export type Holding = { id: string; ticker: string; quantity: number; avgCost: number };
export type UserProfile = {
  id: string; finnhub_key: string | null; theme: string;
  sidebar_collapsed: boolean; active_dashboard_id: string | null;
  onboarding_completed: boolean; portfolio_holdings: Holding[];
  created_at: string; updated_at: string;
};
export type StoredDashboard = {
  id: string; user_id: string; name: string; widgets: WidgetConfig[];
  position: number; created_at: string; updated_at: string;
};
export type Session = { user: { id: string; email: string } };
