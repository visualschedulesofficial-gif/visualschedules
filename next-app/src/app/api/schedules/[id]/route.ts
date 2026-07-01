import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "vs_session";

function getEnv(): { DB?: any } {
  const symbol = Symbol.for("__cloudflare-context__");
  const ctx = (globalThis as any)[symbol];
  return ctx?.env || {};
}

async function getUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE);
    if (!session?.value) return null;
    const data = JSON.parse(Buffer.from(session.value, "base64").toString());
    if (Date.now() - data.createdAt > 30 * 24 * 60 * 60 * 1000) return null;
    return data.userId || null;
  } catch {
    return null;
  }
}

// GET /api/schedules/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const env = getEnv();
  if (!env.DB) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  try {
    const row = await env.DB.prepare(
      `SELECT * FROM schedules WHERE id = ? AND user_id = ?`
    ).bind(id, userId).first();

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      id: row.id,
      title: row.title,
      scheduleType: row.schedule_type,
      language: row.language,
      gender: row.gender,
      gridCols: row.grid_cols,
      customColNames: row.custom_col_names ? JSON.parse(row.custom_col_names) : null,
      weekMode: row.week_mode,
      cardStyle: row.card_style,
      data: row.data ? JSON.parse(row.data) : {},
      updatedAt: row.updated_at,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

// PUT /api/schedules/:id — update (called by auto-save and export)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ saved: false, reason: "not_logged_in" });

  const env = getEnv();
  if (!env.DB) return NextResponse.json({ saved: false, reason: "db_unavailable" });

  try {
    const body = await request.json();
    const {
      title, scheduleType, language, gender,
      gridCols, customColNames, weekMode, cardStyle, data
    } = body;

    await env.DB.prepare(
      `INSERT INTO schedules (id, user_id, title, schedule_type, language, gender,
         grid_cols, custom_col_names, week_mode, card_style, data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         schedule_type = excluded.schedule_type,
         language = excluded.language,
         gender = excluded.gender,
         grid_cols = excluded.grid_cols,
         custom_col_names = excluded.custom_col_names,
         week_mode = excluded.week_mode,
         card_style = excluded.card_style,
         data = excluded.data,
         updated_at = datetime('now')
       WHERE schedules.user_id = ?`
    ).bind(
      id, userId,
      title || "My Schedule",
      scheduleType || "daily",
      language || "en",
      gender || "neutral",
      gridCols || 3,
      customColNames ? JSON.stringify(customColNames) : null,
      weekMode || "week",
      cardStyle || "white",
      JSON.stringify(data || {}),
      userId
    ).run();

    return NextResponse.json({ saved: true, id, updatedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error("Schedule update error:", err);
    return NextResponse.json({ saved: false, error: err?.message }, { status: 500 });
  }
}

// DELETE /api/schedules/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const env = getEnv();
  if (!env.DB) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  try {
    await env.DB.prepare(
      `DELETE FROM schedules WHERE id = ? AND user_id = ?`
    ).bind(id, userId).run();
    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
