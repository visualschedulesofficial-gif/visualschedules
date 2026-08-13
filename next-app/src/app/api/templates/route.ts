import { NextResponse } from "next/server";
import { getEnv } from "@/lib/admin-auth";

// GET /api/templates — every admin-curated template. Public: no personal
// login required, since these are meant for any visitor to browse and start
// from, the same way the old hardcoded Templates screen was.
export async function GET() {
  const env = getEnv();
  if (!env.DB) return NextResponse.json({ templates: [] });

  try {
    const result = await env.DB.prepare(
      `SELECT id, title, schedule_type, language, gender, updated_at
       FROM schedules
       WHERE is_template = 1
       ORDER BY updated_at DESC`
    ).all();

    const templates = (result.results || []).map((r: any) => ({
      id: r.id,
      title: r.title,
      scheduleType: r.schedule_type,
      language: r.language,
      gender: r.gender,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json({ templates });
  } catch (err: any) {
    return NextResponse.json({ templates: [], error: err?.message });
  }
}
