import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "vs_session";

function getEnv(): any {
  const symbol = Symbol.for("__cloudflare-context__");
  const ctx = (globalThis as any)[symbol];
  return ctx?.env || {};
}

// Created on first use — this project's migration runner can't be used (see
// deploy.yml), so the table is defined here instead.
async function ensureTable(env: any) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS activity (
       id TEXT PRIMARY KEY,
       event TEXT NOT NULL,
       detail TEXT,
       signed_in INTEGER NOT NULL DEFAULT 0,
       created_at TEXT NOT NULL DEFAULT (datetime('now'))
     )`
  ).run();
}

async function isAdmin(env: any): Promise<boolean> {
  try {
    const store = await cookies();
    const session = store.get(SESSION_COOKIE);
    if (!session?.value || !env.DB) return false;
    const data = JSON.parse(Buffer.from(session.value, "base64").toString());
    if (!data.userId) return false;
    const user = await env.DB.prepare("SELECT role FROM users WHERE id = ?")
      .bind(data.userId)
      .first();
    return (user as any)?.role === "admin";
  } catch {
    return false;
  }
}

// Only these are accepted — an open endpoint would let anyone flood the table.
const ALLOWED = new Set([
  "builder_opened",     // reached the create screen
  "card_added",         // added a step — the first real sign of engagement
  "schedule_saved",     // saved (requires an account)
  "schedule_downloaded",// exported a PDF/image
  "schedule_used",      // opened the check-off view — the habit signal
  "step_checked",       // ticked a step off — the strongest signal of all
  "paywall_seen",       // tapped a locked card
  "plans_viewed",       // reached the pricing page
]);

// POST /api/activity  body: { event, detail? }
// Deliberately stores NO identity — no user id, no ip, no device id. It answers
// "are people getting value?" without tracking individuals.
export async function POST(request: NextRequest) {
  const env = getEnv();
  if (!env.DB) return NextResponse.json({ ok: false });

  try {
    const b = await request.json().catch(() => null);
    const event = String(b?.event || "");
    if (!ALLOWED.has(event)) return NextResponse.json({ ok: false });

    let signedIn = 0;
    try {
      const store = await cookies();
      signedIn = store.get(SESSION_COOKIE)?.value ? 1 : 0;
    } catch {}

    await ensureTable(env);
    await env.DB.prepare(
      `INSERT INTO activity (id, event, detail, signed_in) VALUES (?, ?, ?, ?)`
    )
      .bind(
        `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        event,
        String(b?.detail || "").slice(0, 120) || null,
        signedIn
      )
      .run();

    return NextResponse.json({ ok: true });
  } catch {
    // Never let tracking break the app for the user.
    return NextResponse.json({ ok: false });
  }
}

// GET /api/activity — admin only. Daily counts per event for the last 30 days.
export async function GET() {
  const env = getEnv();
  if (!env.DB) return NextResponse.json({ rows: [], totals: [] });
  if (!(await isAdmin(env))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureTable(env);

    const totals = await env.DB.prepare(
      `SELECT event,
              COUNT(*) AS count,
              SUM(signed_in) AS by_signed_in
       FROM activity
       WHERE created_at >= datetime('now', '-30 days')
       GROUP BY event
       ORDER BY count DESC`
    ).all();

    const daily = await env.DB.prepare(
      `SELECT date(created_at) AS day, event, COUNT(*) AS count
       FROM activity
       WHERE created_at >= datetime('now', '-14 days')
       GROUP BY day, event
       ORDER BY day DESC`
    ).all();

    return NextResponse.json({
      totals: totals.results || [],
      rows: daily.results || [],
    });
  } catch (err: any) {
    return NextResponse.json({ totals: [], rows: [], error: err?.message });
  }
}
