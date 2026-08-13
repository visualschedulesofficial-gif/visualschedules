import { NextRequest, NextResponse } from "next/server";
import { getEnv, requireAdmin } from "@/lib/admin-auth";

// PATCH /api/admin/templates/:id — unlist it (is_template=0) without
// deleting the underlying schedule; it just stops appearing under Templates.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const env = getEnv();
  if (!(await requireAdmin(env))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!env.DB) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  try {
    await env.DB.prepare(`UPDATE schedules SET is_template = 0 WHERE id = ?`).bind(id).run();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

// DELETE /api/admin/templates/:id — remove the template entirely. Any admin
// can do this regardless of who originally created it (the personal
// DELETE /api/schedules/:id is owner-only; this is the admin-wide version).
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const env = getEnv();
  if (!(await requireAdmin(env))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!env.DB) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  try {
    await env.DB.prepare(`DELETE FROM schedules WHERE id = ? AND is_template = 1`).bind(id).run();
    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
