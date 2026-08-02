import { NextRequest, NextResponse } from "next/server";
import { getEnv, requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

function makeCode(name: string) {
  const base = (name || "CENTER").replace(/[^a-z]/gi, "").toUpperCase().slice(0, 8) || "CENTER";
  const num = Math.floor(10 + Math.random() * 90);
  return `${base}${num}`;
}

// GET — all orgs with their member emails
export async function GET() {
  const env = getEnv();
  if (!(await requireAdmin(env))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { results: orgs } = await env.DB.prepare(
    "SELECT id, name, logo_url, access_code, active, created_at FROM orgs ORDER BY created_at DESC"
  ).all();
  const { results: members } = await env.DB.prepare(
    "SELECT email, org_id FROM org_members ORDER BY email"
  ).all();
  let usage: any[] = [];
  try {
    const { results } = await env.DB.prepare(
      `SELECT org_id,
              COUNT(*) AS total_uses,
              COUNT(DISTINCT device_hash) AS unique_devices,
              MAX(redeemed_at) AS last_used
       FROM org_redemptions GROUP BY org_id`
    ).all();
    usage = results || [];
  } catch {}
  return NextResponse.json({ orgs: orgs || [], members: members || [], usage });
}

// POST — create org, add member, or regenerate code
export async function POST(request: NextRequest) {
  const env = getEnv();
  if (!(await requireAdmin(env))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();

  if (body.kind === "org") {
    if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });
    const id = crypto.randomUUID();
    const code = makeCode(body.name);
    await env.DB.prepare(
      "INSERT INTO orgs (id, name, logo_url, access_code, active) VALUES (?, ?, ?, ?, 1)"
    ).bind(id, body.name, body.logoUrl || null, code).run();
    return NextResponse.json({ ok: true, id, code });
  }

  if (body.kind === "member") {
    if (!body.orgId || !body.email) return NextResponse.json({ error: "orgId and email required" }, { status: 400 });
    await env.DB.prepare(
      "INSERT OR REPLACE INTO org_members (email, org_id) VALUES (?, ?)"
    ).bind(body.email.trim().toLowerCase(), body.orgId).run();
    return NextResponse.json({ ok: true });
  }

  if (body.kind === "regenerate-code") {
    if (!body.orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });
    const org = await env.DB.prepare("SELECT name FROM orgs WHERE id = ?").bind(body.orgId).first();
    if (!org) return NextResponse.json({ error: "not found" }, { status: 404 });
    const code = makeCode(org.name as string);
    await env.DB.prepare("UPDATE orgs SET access_code = ? WHERE id = ?").bind(code, body.orgId).run();
    return NextResponse.json({ ok: true, code });
  }

  return NextResponse.json({ error: "unknown kind" }, { status: 400 });
}

// PUT — update org (name / logo / active)
export async function PUT(request: NextRequest) {
  const env = getEnv();
  if (!(await requireAdmin(env))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await env.DB.prepare(
    "UPDATE orgs SET name = ?, logo_url = ?, active = ? WHERE id = ?"
  ).bind(body.name, body.logoUrl || null, body.active ? 1 : 0, body.id).run();
  return NextResponse.json({ ok: true });
}

// DELETE — remove a member email, or a whole org (with its members)
export async function DELETE(request: NextRequest) {
  const env = getEnv();
  if (!(await requireAdmin(env))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const orgId = searchParams.get("orgId");
  if (email) {
    await env.DB.prepare("DELETE FROM org_members WHERE email = ?").bind(email.toLowerCase()).run();
    return NextResponse.json({ ok: true });
  }
  if (orgId) {
    await env.DB.prepare("DELETE FROM org_members WHERE org_id = ?").bind(orgId).run();
    await env.DB.prepare("DELETE FROM orgs WHERE id = ?").bind(orgId).run();
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "email or orgId required" }, { status: 400 });
}
