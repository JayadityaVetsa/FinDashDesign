import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getDatabase } from "./database";
import type { Session } from "../models";
const scrypt = promisify(scryptCallback);
export const SESSION_COOKIE = "findash-session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
export const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}
export async function checkPassword(password: string, encoded: string) {
  const [salt, hex] = encoded.split(":");
  const expected = Buffer.from(hex, "hex");
  const actual = await scrypt(password, salt, 64) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const sql = await getDatabase();
  await sql.transaction([
    sql.query("DELETE FROM findash_sessions WHERE expires_at <= $1", [Date.now()]),
    sql.query("INSERT INTO findash_sessions (token_hash,user_id,expires_at) VALUES ($1,$2,$3)",
      [tokenHash(token), userId, Date.now() + SESSION_MAX_AGE * 1000]),
  ]);
  return token;
}
export async function sessionFromToken(token?: string): Promise<Session | null> {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const sql = await getDatabase();
  const rows = await sql.query(`SELECT u.id,u.email FROM findash_sessions s JOIN findash_users u ON u.id=s.user_id
    WHERE s.token_hash=$1 AND s.expires_at>$2`, [tokenHash(token), Date.now()]);
  return rows[0] ? { user: { id: String(rows[0].id), email: String(rows[0].email) } } : null;
}
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = process.env.APP_ORIGIN || new URL(request.url).origin;
  if (!origin || origin !== allowed) throw new Error("Invalid request origin.");
}
export async function consumeAuthAttempt(email: string, limit = 10) {
  const sql = await getDatabase();
  const now = Date.now();
  const cutoff = now - 15 * 60 * 1000;
  const [, rows] = await sql.transaction([
    sql.query("DELETE FROM findash_auth_attempts WHERE window_start < $1", [cutoff]),
    sql.query(`INSERT INTO findash_auth_attempts (email,count,window_start) VALUES ($1,1,$2)
      ON CONFLICT(email) DO UPDATE SET count=CASE WHEN findash_auth_attempts.window_start<$3 THEN 1 ELSE findash_auth_attempts.count+1 END,
      window_start=CASE WHEN findash_auth_attempts.window_start<$3 THEN $2 ELSE findash_auth_attempts.window_start END RETURNING count`, [email, now, cutoff]),
  ]);
  if (Number(rows[0].count) > limit) throw new Error("Too many attempts. Try again in 15 minutes.");
}
