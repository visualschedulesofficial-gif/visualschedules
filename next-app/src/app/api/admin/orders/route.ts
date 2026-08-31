import { NextResponse } from "next/server";
import { getEnv, requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

// GET /api/admin/orders — every subscription/access grant ever created,
// real rows from the database, newest first.
export async function GET() {
  const env = getEnv();
  if (!(await requireAdmin(env))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!env.DB) return NextResponse.json({ error: "No database" }, { status: 500 });

  try {
    const { results } = await env.DB.prepare(
      `SELECT s.id, u.email, s.type, s.status, s.expires_at, s.created_at
       FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       ORDER BY s.created_at DESC`
    ).all();
    return NextResponse.json({ orders: results || [] });
  } catch (err) {
    return NextResponse.json({ error: "Could not load orders", orders: [] });
  }
}
