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

    return NextResponse.json({ templates });
  } catch (err: any) {
    return NextResponse.json({ templates: [], error: err?.message });
  }
}
