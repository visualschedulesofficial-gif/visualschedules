import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "vs_session";

function getEnv(): { DB?: any } {
  const symbol = Symbol.for("__cloudflare-context__");
  const ctx = (globalThis as any)[symbol];
  return ctx?.env || {};
}

async function requireAdmin(env: any): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE);
    if (!session?.value || !env.DB) return false;
    const data = JSON.parse(Buffer.from(session.value, "base64").toString());
    if (!data.userId) return false;
    const user = await env.DB.prepare("SELECT role FROM users WHERE id = ?")
      .bind(data.userId)
      .first();
    return user?.role === "admin";
  } catch {
    return false;
  }
}

// GET /api/admin/subscriptions
// Every subscription, joined to its account. A blank email means the
// subscription is attached to a user id that no longer matches an account —
// which is exactly what happens when someone pays while signed in under a
// different identity (e.g. via a centre code) than the email they later use.
export async function GET() {
  const env = getEnv();
  if (!(await requireAdmin(env))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subs = await env.DB.prepare(
      `SELECT s.id, s.user_id, s.type, s.status, s.created_at, s.expires_at,
              u.email AS email
       FROM subscriptions s
       LEFT JOIN users u ON u.id = s.user_id
       ORDER BY s.created_at DESC
       LIMIT 100`
    ).all();

    const users = await env.DB.prepare(
      `SELECT id, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 100`
    ).all();

    return NextResponse.json({
      subscriptions: subs.results || [],
      users: users.results || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

// POST /api/admin/subscriptions  body: { email, months }
// Grants access to whoever owns that email. Use this to credit a payment that
// didn't record properly, or to comp a therapist/influencer.
export async function POST(request: NextRequest) {
  const env = getEnv();
  if (!(await requireAdmin(env))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const months = Number(body?.months || 12);
  if (!email || !months) {
    return NextResponse.json({ error: "Email and months are required" }, { status: 400 });
  }

  try {
    const user = await env.DB.prepare("SELECT id FROM users WHERE lower(email) = ?")
      .bind(email)
      .first();
    if (!user?.id) {
      return NextResponse.json(
        { error: `No account found for ${email}. They need to sign in once first.` },
        { status: 404 }
      );
    }

    const id = `manual_${Date.now()}`;
    await env.DB.prepare(
      `INSERT INTO subscriptions (id, user_id, type, status, created_at, expires_at)
       VALUES (?, ?, ?, 'active', datetime('now'), datetime('now', '+' || ? || ' months'))`
    ).bind(id, user.id, `${months}mo`, String(months)).run();

    return NextResponse.json({ ok: true, email, months });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

// DELETE /api/admin/subscriptions?id=...  — revoke one subscription.
export async function DELETE(request: NextRequest) {
  const env = getEnv();
  if (!(await requireAdmin(env))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    await env.DB.prepare(`UPDATE subscriptions SET status = 'cancelled' WHERE id = ?`)
      .bind(id)
      .run();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
