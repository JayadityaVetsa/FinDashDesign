import { neon, neonConfig, type NeonQueryFunction } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import type { StoredDashboard, UserProfile } from "../models";
import type { WidgetConfig } from "../widgetConfig";
import { schemaStatements } from "./schema";
let client: NeonQueryFunction<false, false> | undefined;
let initializing: Promise<void> | undefined;
export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}
export function rawSql() {
  if (client) return client;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("Connect Neon Postgres to this Vercel project, then redeploy. DATABASE_URL is missing.");
  // Support the documented local Neon HTTP proxy for integration tests.
  const parsed = new URL(url);
  if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
    neonConfig.fetchEndpoint = `http://${parsed.host}/sql`;
  }
  client = neon(url);
  return client;
}
export async function getDatabase() {
  const sql = rawSql();
  initializing ??= sql.transaction(schemaStatements.map(statement => sql.query(statement)))
    .then(() => {}).catch(error => { initializing = undefined; throw error; });
  await initializing;
  return sql;
}
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const sql = await getDatabase();
  const rows = await sql.query("SELECT * FROM findash_profiles WHERE id=$1", [userId]);
  if (!rows[0]) throw new Error("Profile not found.");
  return rows[0] as UserProfile;
}
export async function listDashboards(userId: string): Promise<StoredDashboard[]> {
  const sql = await getDatabase();
  return await sql.query("SELECT * FROM findash_dashboards WHERE user_id=$1 ORDER BY position,created_at,id", [userId]) as StoredDashboard[];
}
export async function insertDashboard(userId: string, name: string, widgets: WidgetConfig[], position: number) {
  const sql = await getDatabase();
  const rows = await sql.query("INSERT INTO findash_dashboards (id,user_id,name,widgets,position) VALUES ($1,$2,$3,$4::jsonb,$5) RETURNING *",
    [randomUUID(), userId, name, JSON.stringify(widgets), position]);
  return rows[0] as StoredDashboard;
}
export async function initializeWorkspace(userId: string, seeds: { name: string; widgets: WidgetConfig[] }[], key?: string) {
  const sql = await getDatabase();
  return await sql.query("SELECT * FROM findash_initialize_workspace($1,$2::jsonb,$3)", [userId, JSON.stringify(seeds), key ?? null]) as StoredDashboard[];
}
