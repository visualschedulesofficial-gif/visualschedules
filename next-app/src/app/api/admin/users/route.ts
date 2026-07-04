import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "vs_session";

function getEnv(): { DB?: any } {
  const symbol = Symbol.for("__cloudflare-context__");
  const ctx = (globalThis as any)[symbol];
  return ctx?.env || {};
}

// Only admins may use these endpoints
async function requireAdmin(env: any): Promise<{ ok: boolean; userId?: string }> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE);
    if (!session?.value || !env.DB) return { ok: false };
    const data = JSON.parse(Buffer.from(session.value, "base64").toString());
    if (!data.userId) return { ok: false };
    const user = await env.DB.prepare("SELECT role FROM users WHERE id = ?")
      .bind(data.userId)
      .first();
    return { ok: user?.role === "admin", userId: data.userId };
  } catch {
    return { ok: false };
  }
}

// GET /api/admin/users — all users with their current access status
export async function GET() {
  const env = getEnv();
  const auth = await requireAdmin(env);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { results } = await env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.role, u.created_at,
            s.id AS sub_id, s.type AS sub_type, s.status AS sub_status,
            s.expires_at AS sub_expires
     FROM users u
     LEFT JOIN subscriptions s
       ON s.id = (
         SELECT id FROM subscriptions
         WHERE user_id = u.id
           AND status = 'active'
           AND (expires_at IS NULL OR expires_at > datetime('now'))
         ORDER BY created_at DESC
         LIMIT 1
       )
     ORDER BY u.created_at DESC`
  ).all();

  return NextResponse.json({ users: results || [] });
}

// POST /api/admin/users — grant complimentary access
// body: { email: string, months: number }
export async function POST(request: NextRequest) {
  const env = getEnv();
  const auth = await requireAdmin(env);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const email = (body?.email || "").trim().toLowerCase();
  const months = Number(body?.months) || 6;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (![1, 3, 6, 12].includes(months)) {
    return NextResponse.json({ error: "Duration must be 1, 3, 6 or 12 months" }, { status: 400 });
  }

  // Find the user — or pre-create them so the comp is waiting when they
  // first log in with this email (login is OTP by email, no password).
  let user = await env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first();

  if (!user) {
    const newId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO users (id, email, role, created_at, updated_at)
       VALUES (?, ?, 'user', datetime('now'), datetime('now'))`
    ).bind(newId, email).run();
    user = { id: newId };
  }

  // One active comp at a time: revoke any previous active comp first
  await env.DB.prepare(
    `UPDATE subscriptions SET status = 'revoked'
     WHERE user_id = ? AND type = 'comp' AND status = 'active'`
  ).bind(user.id).run();

  const subId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO subscriptions (id, user_id, type, status, created_at, expires_at)
     VALUES (?, ?, 'comp', 'active', datetime('now'), datetime('now', '+' || ? || ' months'))`
  ).bind(subId, user.id, String(months)).run();

  return NextResponse.json({ ok: true, subscriptionId: subId });
}

// DELETE /api/admin/users — revoke a comp
// body: { subscriptionId: string }
export async function DELETE(request: NextRequest) {
  const env = getEnv();
  const auth = await requireAdmin(env);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const subscriptionId = body?.subscriptionId;
  if (!subscriptionId) {
    return NextResponse.json({ error: "subscriptionId required" }, { status: 400 });
  }

  // Only comps can be revoked here — paid subscriptions are handled elsewhere
  await env.DB.prepare(
    `UPDATE subscriptions SET status = 'revoked'
     WHERE id = ? AND type = 'comp'`
  ).bind(subscriptionId).run();

  return NextResponse.json({ ok: true });
}
