import { supabase } from "./supabaseClient";
import type { WidgetConfig } from "./widgetConfig";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type UserProfile = {
  id: string;
  finnhub_key: string | null;
  theme: string;
  sidebar_collapsed: boolean;
  active_dashboard_id: string | null;
  onboarding_completed: boolean;
  portfolio_holdings: any[];
  created_at: string;
  updated_at: string;
};

export type SupaDashboard = {
  id: string;
  user_id: string;
  name: string;
  widgets: WidgetConfig[];
  position: number;
  created_at: string;
  updated_at: string;
};

/* ------------------------------------------------------------------ */
/*  Profile operations                                                 */
/* ------------------------------------------------------------------ */

/** Fetch a user's profile. Returns null if it doesn't exist yet. */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

/** Create or update a profile (upsert on id). */
export async function upsertProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, "id" | "created_at" | "updated_at">>
) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...updates }, { onConflict: "id" });
  if (error) throw error;
}

/** Patch specific fields on an existing profile. */
export async function updateProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, "id" | "created_at" | "updated_at">>
) {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Dashboard operations                                               */
/* ------------------------------------------------------------------ */

/** Get all dashboards for a user, ordered by position. */
export async function getUserDashboards(
  userId: string
): Promise<SupaDashboard[]> {
  const { data, error } = await supabase
    .from("dashboards")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true });

  if (error) throw error;
  return (data || []) as SupaDashboard[];
}

/** Create a new dashboard. Returns the created row. */
export async function createDashboard(
  userId: string,
  name: string,
  widgets: WidgetConfig[] = [],
  position: number = 0
): Promise<SupaDashboard> {
  const { data, error } = await supabase
    .from("dashboards")
    .insert({ user_id: userId, name, widgets, position })
    .select()
    .single();

  if (error) throw error;
  return data as SupaDashboard;
}

/** Update fields on an existing dashboard (name, widgets, position). */
export async function updateDashboard(
  dashboardId: string,
  updates: Partial<{ name: string; widgets: WidgetConfig[]; position: number }>
) {
  const { error } = await supabase
    .from("dashboards")
    .update(updates)
    .eq("id", dashboardId);
  if (error) throw error;
}

/** Delete a dashboard by id. */
export async function deleteDashboard(dashboardId: string) {
  const { error } = await supabase
    .from("dashboards")
    .delete()
    .eq("id", dashboardId);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Seed helpers                                                       */
/* ------------------------------------------------------------------ */

/**
 * Seed dashboards for a brand-new user using the data from
 * `createSeedDashboards()` in widgetConfig.ts.
 *
 * Returns the newly-created rows so the caller can set state.
 */
export async function seedDashboards(
  userId: string,
  seeds: { name: string; widgets: WidgetConfig[] }[]
): Promise<SupaDashboard[]> {
  const rows = seeds.map((s, i) => ({
    user_id: userId,
    name: s.name,
    widgets: s.widgets,
    position: i,
  }));

  const { data, error } = await supabase
    .from("dashboards")
    .insert(rows)
    .select();

  if (error) throw error;
  return (data || []) as SupaDashboard[];
}
