import { NextRequest, NextResponse } from "next/server";

// GET /api/cards/images — return all card images (for schedule builder)
export async function GET(request: NextRequest) {
  try {
    const symbol = Symbol.for("__cloudflare-context__");
    const ctx = (globalThis as any)[symbol];
    const env = ctx?.env;

    if (!env?.DB) {
      return NextResponse.json({ images: {} });
    }

    const result = await env.DB.prepare(
      `SELECT card_id, variant, r2_key FROM card_images`
    ).all();

    // Build a map: { cardId: { variant: url } }
    const images: Record<string, Record<string, string>> = {};
    for (const row of (result.results || [])) {
      const r = row as { card_id: string; variant: string; r2_key: string };
      if (!images[r.card_id]) images[r.card_id] = {};
      images[r.card_id][r.variant] = `/api/images/${r.r2_key}`;
    }

    return NextResponse.json({ images }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch {
    return NextResponse.json({ images: {} });
  }
}
