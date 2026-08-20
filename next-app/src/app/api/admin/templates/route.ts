import { NextResponse } from "next/server";
import { getEnv, requireAdmin } from "@/lib/admin-auth";

// GET /api/admin/templates — every template, for the admin management page.
export async function GET() {
  const env = getEnv();
  if (!(await requireAdmin(env))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!env.DB) return NextResponse.json({ templates: [] });

  try {
    const result = await env.DB.prepare(
      `SELECT s.id, s.title, s.schedule_type, s.language, s.gender, s.updated_at,
              u.email AS creator_email
       FROM schedules s
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.is_template = 1
       ORDER BY s.updated_at DESC`
    ).all();

    const templates = (result.results || []).map((r: any) => ({
      id: r.id,
      title: r.title,
      scheduleType: r.schedule_type,
      language: r.language,
      gender: r.gender,
      updatedAt: r.updated_at,
      creatorEmail: r.creator_email,
    }));

    // Also return schedules that are NOT templates yet, so the admin panel
    // can promote an existing one instead of requiring it to be rebuilt on
    // mobile with the checkbox ticked.
    const candidatesRes = await env.DB.prepare(
      `SELECT s.id, s.title, s.schedule_type, s.updated_at, u.email AS creator_email
       FROM schedules s
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.is_template = 0
       ORDER BY s.updated_at DESC
       LIMIT 50`
    ).all();

    const candidates = (candidatesRes.results || []).map((r: any) => ({
      id: r.id,
      title: r.title,
      scheduleType: r.schedule_type,
      updatedAt: r.updated_at,
      creatorEmail: r.creator_email,
    }));

    return NextResponse.json({ templates, candidates });
  } catch (err: any) {
    return NextResponse.json({ templates: [], error: err?.message });
  }
}


// POST /api/admin/templates  body: { id }
// Promote an existing schedule to a template. This is what the admin panel
// uses; the mobile checkbox does the same thing at save time.
export async function POST(request: Request) {
  const env = getEnv();
  if (!(await requireAdmin(env))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!env.DB) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const body = await request.json().catch(() => null);
  const id = String((body as any)?.id || "");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    await env.DB.prepare(`UPDATE schedules SET is_template = 1 WHERE id = ?`).bind(id).run();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
