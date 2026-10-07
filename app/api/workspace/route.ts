import { NextRequest, NextResponse } from "next/server";
import { getDatabase,getUserProfile,listDashboards,insertDashboard,initializeWorkspace } from "@/lib/server/database";
import { assertSameOrigin,SESSION_COOKIE,sessionFromToken } from "@/lib/server/security";
import { text,widgets,holdings } from "@/lib/server/validation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (value:unknown,status=200) => NextResponse.json(value,{ status,headers:{"Cache-Control":"no-store"} });
async function userId(request:NextRequest) {
  const session = await sessionFromToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) throw new Error("Please sign in again.");
  const expected = request.headers.get("X-FinDash-User");
  if (expected && expected !== session.user.id) throw new Error("The signed-in account changed. Reload this tab before editing.");
  return session.user.id;
}
function failure(error:unknown) {
  const message = error instanceof Error ? error.message : "Request failed.";
  if (message === "Please sign in again.") return json({ error:message },401);
  if (message === "Invalid request origin." || message.startsWith("The signed-in account changed")) return json({ error:message },403);
  if (/^Invalid|^Choose|^Dashboard|^Keep/.test(message) || error instanceof SyntaxError) return json({ error:message },400);
  return json({ error:"Unable to access your workspace. Please retry or check the database connection." },500);
}
export async function GET(request:NextRequest) {
  try {
    const uid = await userId(request);
    const resource = request.nextUrl.searchParams.get("resource");
    if (resource === "profile") return json(await getUserProfile(uid));
    if (resource === "dashboards") return json(await listDashboards(uid));
    return json({ error:"Invalid resource." },400);
  } catch (error) { return failure(error); }
}
export async function POST(request:NextRequest) {
  try {
    assertSameOrigin(request);
    const uid = await userId(request);
    const raw = await request.text();
    if (raw.length > 1024*1024) return json({ error:"Request too large." },413);
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid request.");
    const sql = await getDatabase();
    if (body.action === "initialize") {
      if (!Array.isArray(body.seeds) || body.seeds.length < 1 || body.seeds.length > 20) throw new Error("Invalid starter dashboards.");
      const seeds = body.seeds.map((s:{name:unknown;widgets:unknown}) => ({ name:text(s?.name),widgets:widgets(s?.widgets) }));
      const key = body.finnhubKey === undefined ? undefined : text(body.finnhubKey,200);
      return json(await initializeWorkspace(uid,seeds,key));
    }
    if (body.action === "create") {
      if ((await listDashboards(uid)).length >= 50) throw new Error("Dashboard limit reached (50).");
      const position = Number.isInteger(body.position) && body.position >= 0 ? body.position : 0;
      return json(await insertDashboard(uid,text(body.name),widgets(body.widgets),position));
    }
    if (body.action === "profile") {
      const u = body.updates;
      if (!u || typeof u !== "object" || Array.isArray(u)) throw new Error("Invalid profile update.");
      const fields:string[]=[];
      const values:unknown[]=[];
      for (const [key,value] of Object.entries(u)) {
        const placeholder = `$${values.length+1}`;
        if (key === "theme" && (value === "dark" || value === "light")) { fields.push(`theme=${placeholder}`);values.push(value); }
        else if (key === "sidebar_collapsed" && typeof value === "boolean") { fields.push(`sidebar_collapsed=${placeholder}`);values.push(value); }
        else if (key === "finnhub_key") { fields.push(`finnhub_key=${placeholder}`);values.push(text(value,200)); }
        else if (key === "portfolio_holdings") { fields.push(`portfolio_holdings=${placeholder}::jsonb`);values.push(JSON.stringify(holdings(value))); }
        else if (key === "active_dashboard_id") {
          if (!(await sql.query("SELECT id FROM findash_dashboards WHERE id=$1 AND user_id=$2",[text(value,150),uid])).length) throw new Error("Dashboard not found.");
          fields.push(`active_dashboard_id=${placeholder}`);values.push(value);
        } else throw new Error("Invalid profile field.");
      }
      if (!fields.length) throw new Error("Invalid empty update.");
      await sql.query(`UPDATE findash_profiles SET ${fields.join(',')},updated_at=now() WHERE id=$${values.length+1}`,[...values,uid]);
      return json({ ok:true });
    }
    const id=text(body.id,150);
    if (!(await sql.query("SELECT id FROM findash_dashboards WHERE id=$1 AND user_id=$2",[id,uid])).length) throw new Error("Dashboard not found.");
    if (body.action === "delete") {
      await sql.query("SELECT findash_delete_dashboard($1,$2)",[uid,id]);
      return json({ ok:true });
    }
    if (body.action === "update") {
      const u=body.updates;
      if (!u || typeof u !== "object" || Array.isArray(u)) throw new Error("Invalid dashboard update.");
      const fields:string[]=[];
      const values:unknown[]=[];
      for (const [key,value] of Object.entries(u)) {
        const placeholder=`$${values.length+1}`;
        if (key === "name") { fields.push(`name=${placeholder}`);values.push(text(value)); }
        else if (key === "widgets") { fields.push(`widgets=${placeholder}::jsonb`);values.push(JSON.stringify(widgets(value))); }
        else if (key === "position" && Number.isInteger(value) && Number(value)>=0) { fields.push(`position=${placeholder}`);values.push(value); }
        else throw new Error("Invalid dashboard field.");
      }
      if (!fields.length) throw new Error("Invalid empty update.");
      await sql.query(`UPDATE findash_dashboards SET ${fields.join(',')},updated_at=now() WHERE id=$${values.length+1} AND user_id=$${values.length+2}`,[...values,id,uid]);
      return json({ ok:true });
    }
    return json({ error:"Invalid action." },400);
  } catch(error) { return failure(error); }
}
