import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/admin-auth";

export const runtime = "nodejs";

// POST /api/downloads/track — body: { fileId, kind: "view" | "download" }
export async function POST(request: NextRequest) {
  try {
    const env = getEnv();
    const { fileId, kind } = await request.json();
    if (!fileId || !env.DB || (kind !== "view" && kind !== "download")) {
      return NextResponse.json({ ok: false });
    }
    const column = kind === "view" ? "view_count" : "download_count";
    await env.DB.prepare(
      `UPDATE download_files SET ${column} = COALESCE(${column}, 0) + 1 WHERE id = ?`
    ).bind(fileId).run();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
