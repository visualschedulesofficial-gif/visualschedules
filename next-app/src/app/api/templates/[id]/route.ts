import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/admin-auth";

// GET /api/templates/:id — full data for one template, so it can be copied
// into a new schedule. Public like the list — but only returns a row that
// is actually flagged is_template=1, so this can't be used to read an
// arbitrary user's private schedule by guessing its id.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const env = getEnv();
  if (!env.DB) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  try {
    const row = await env.DB.prepare(
      `SELECT * FROM schedules WHERE id = ? AND is_template = 1`
    ).bind(id).first();

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      id: row.id,
      title: row.title,
      scheduleType: row.schedule_type,
      language: row.language,
      gender: row.gender,
      gridCols: row.grid_cols,
      data: row.data ? JSON.parse(row.data as string) : {},
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
