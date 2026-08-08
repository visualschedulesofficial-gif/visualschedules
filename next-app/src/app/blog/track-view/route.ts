import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/admin-auth";

export const runtime = "nodejs";

// POST /api/blog/track-view — body: { slug }. Called once per post view
// (client-side, on the post detail page) to bump its view count.
export async function POST(request: NextRequest) {
  try {
    const env = getEnv();
    const { slug } = await request.json();
    if (!slug || !env.DB) return NextResponse.json({ ok: false });
    await env.DB.prepare(
      "UPDATE blog_posts SET view_count = COALESCE(view_count, 0) + 1 WHERE slug = ?"
    ).bind(slug).run();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
