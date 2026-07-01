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

// GET /api/schedules — list user's saved schedules
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ schedules: [] });

  const env = getEnv();
  if (!env.DB) return NextResponse.json({ schedules: [] });

  try {
    const result = await env.DB.prepare(
      `SELECT id, title, schedule_type, language, gender, updated_at
       FROM schedules
       WHERE user_id = ?
       ORDER BY updated_at DESC
       LIMIT 50`
    ).bind(userId).all();

    const schedules = (result.results || []).map((r: any) => ({
      id: r.id,
      title: r.title,
      scheduleType: r.schedule_type,
      language: r.language,
      gender: r.gender,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json({ schedules });
  } catch (err: any) {
    return NextResponse.json({ schedules: [], error: err?.message });
  }
}

// POST /api/schedules — create or upsert a schedule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      scheduleType,
      language,
      gender,
      gridCols,
      customColNames,
      weekMode,
      cardStyle,
      data,
    } = body;

    const scheduleId = id || crypto.randomUUID();
    const userId = await getUserId();
    const env = getEnv();

    // If user is logged in and DB is available, save to database
    if (userId && env.DB) {
      // Ensure user row exists (upsert)
      await env.DB.prepare(
        `INSERT OR IGNORE INTO users (id, email, role, created_at, updated_at)
         VALUES (?, ?, 'user', datetime('now'), datetime('now'))`
      ).bind(userId, userId.replace("user-", "") + "@placeholder").run();

      // Upsert the schedule
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
           updated_at = datetime('now')`
      ).bind(
        scheduleId,
        userId,
        title || "My Schedule",
        scheduleType || "daily",
        language || "en",
        gender || "neutral",
        gridCols || 3,
        customColNames ? JSON.stringify(customColNames) : null,
        weekMode || "week",
        cardStyle || "white",
        JSON.stringify(data || {})
      ).run();
    }

    return NextResponse.json({
      id: scheduleId,
      saved: !!(userId && env.DB),
    }, { status: 201 });
  } catch (err: any) {
    console.error("Schedule save error:", err);
    return NextResponse.json({ error: err?.message || "Failed to save" }, { status: 500 });
  }
}
