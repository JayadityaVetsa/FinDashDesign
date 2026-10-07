import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getDatabase, isDatabaseConfigured } from "@/lib/server/database";
import { assertSameOrigin, checkPassword, consumeAuthAttempt, createSession, hashPassword,
  SESSION_COOKIE, SESSION_MAX_AGE, sessionFromToken, tokenHash } from "@/lib/server/security";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) return json({ error: "Connect Neon Postgres to this Vercel project, then redeploy. DATABASE_URL is missing." }, 503);
  try { return json(await sessionFromToken(request.cookies.get(SESSION_COOKIE)?.value)); }
  catch { return json({ error: "Database unavailable. Please retry in a moment or check the project's database connection." }, 503); }
}
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const raw = await request.text();
    if (raw.length > 4096) return json({ error: "Request too large." }, 413);
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid request." }, 400);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 10 || password.length > 128)
      return json({ error: "Enter a valid email and a password between 10 and 128 characters." }, 400);
    await consumeAuthAttempt(email);
    await consumeAuthAttempt("__global__", 200);
    const sql = await getDatabase();
    let [user] = await sql.query("SELECT id,email,password_hash FROM findash_users WHERE email=$1", [email]);
    if (body.register === true) {
      if (process.env.ALLOW_REGISTRATION === "false") return json({ error: "Registration is disabled on this server." }, 403);
      if (user) return json({ error: "Unable to create this account. Try signing in." }, 409);
      const hash = await hashPassword(password);
      const id = randomUUID();
      await sql.transaction([
        sql.query("INSERT INTO findash_users (id,email,password_hash) VALUES ($1,$2,$3)", [id,email,hash]),
        sql.query("INSERT INTO findash_profiles (id) VALUES ($1)", [id]),
      ]);
      user = { id,email,password_hash:hash };
    } else if (!user || !await checkPassword(password, String(user.password_hash))) {
      return json({ error: "Email or password is incorrect." }, 401);
    }
    const token = await createSession(String(user.id));
    const old = request.cookies.get(SESSION_COOKIE)?.value;
    if (old) await sql.query("DELETE FROM findash_sessions WHERE token_hash=$1", [tokenHash(old)]);
    const response = json({ user: { id:user.id,email:user.email } });
    response.cookies.set(SESSION_COOKIE,token,{ httpOnly:true,sameSite:"lax",path:"/",
      secure:new URL(process.env.APP_ORIGIN || request.url).protocol === "https:",maxAge:SESSION_MAX_AGE });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed.";
    if (message === "Invalid request origin.") return json({ error:message },403);
    if (message.startsWith("Too many")) return json({ error:message },429);
    if (error instanceof SyntaxError) return json({ error:"Invalid request." },400);
    return json({ error:"Unable to sign in. Please retry or check the database connection." },500);
  }
}
export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (token) await (await getDatabase()).query("DELETE FROM findash_sessions WHERE token_hash=$1", [tokenHash(token)]);
    const response = json({ ok:true });
    response.cookies.set(SESSION_COOKIE,"",{ httpOnly:true,sameSite:"lax",path:"/",maxAge:0 });
    return response;
  } catch { return json({ error:"Unable to sign out." },400); }
}
