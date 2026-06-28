import { NextRequest, NextResponse } from "next/server";

function getEnv(): { DB?: any } {
  const symbol = Symbol.for("__cloudflare-context__");
  const ctx = (globalThis as any)[symbol];
  return ctx?.env || {};
}

// POST /api/admin/cards — create a new card
export async function POST(request: NextRequest) {
  try {
    const { id, name, categoryId, icon } = await request.json();

    if (!id || !name || !categoryId) {
      return NextResponse.json({ error: "id, name, and categoryId are required" }, { status: 400 });
    }

    const env = getEnv();

    if (env.DB) {
      // Insert card
      await env.DB.prepare(
        `INSERT INTO cards (id, icon, category_id, status, sort_order, created_at) VALUES (?, ?, ?, 'live', 0, datetime('now'))`
      ).bind(id, icon || "s-star", categoryId).run();

      // Insert English translation
      await env.DB.prepare(
        `INSERT INTO card_translations (card_id, lang, label) VALUES (?, 'en', ?)`
      ).bind(id, name).run();

      return NextResponse.json({ success: true, id, name, categoryId }, { status: 201 });
    }

    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create card" }, { status: 500 });
  }
}
