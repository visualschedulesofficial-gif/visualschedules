import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "vs_session";

function getEnv(): any {
  const symbol = Symbol.for("__cloudflare-context__");
  const ctx = (globalThis as any)[symbol];
  return ctx?.env || {};
}

// The table is created on first use rather than via a migration file. This
// project's database was built directly from setup-database.sql, so the
// migration runner tries to replay everything from scratch and fails — see the
// notes in deploy.yml. Creating it here keeps leads working without touching
// that machinery.
async function ensureTable(env: any) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS leads (
       id TEXT PRIMARY KEY,
       name TEXT NOT NULL,
       org TEXT NOT NULL,
       kind TEXT NOT NULL,
       email TEXT NOT NULL,
       phone TEXT NOT NULL,
       city TEXT,
       seats TEXT,
       message TEXT,
       status TEXT NOT NULL DEFAULT 'new',
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

// POST /api/leads — a school or therapy centre asking about pricing.
export async function POST(request: NextRequest) {
  const env = getEnv();
  if (!env.DB) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const b = await request.json().catch(() => null);
  const name = String(b?.name || "").trim();
  const org = String(b?.org || "").trim();
  const kind = String(b?.kind || "").trim();
  const email = String(b?.email || "").trim();
  const phone = String(b?.phone || "").trim();

  if (!name || !org || !kind || !email || !phone) {
    return NextResponse.json(
      { error: "Name, organisation, type, email and phone are all required." },
      { status: 400 }
    );
  }

  try {
    await ensureTable(env);
    await env.DB.prepare(
      `INSERT INTO leads (id, name, org, kind, email, phone, city, seats, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name,
        org,
        kind,
        email,
        phone,
        String(b?.city || "").trim() || null,
        String(b?.seats || "").trim() || null,
        String(b?.message || "").trim() || null
      )
      .run();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Could not save" }, { status: 500 });
  }
}

// GET /api/leads — admin only, newest first.
export async function GET() {
  const env = getEnv();
  if (!env.DB) return NextResponse.json({ leads: [] });
  if (!(await isAdmin(env))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureTable(env);
    const res = await env.DB.prepare(
      `SELECT id, name, org, kind, email, phone, city, seats, message, status, created_at
       FROM leads ORDER BY created_at DESC LIMIT 200`
    ).all();
    return NextResponse.json({ leads: res.results || [] });
  } catch (err: any) {
    return NextResponse.json({ leads: [], error: err?.message });
  }
}
