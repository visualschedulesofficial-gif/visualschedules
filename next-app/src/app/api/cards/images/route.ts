import { NextRequest, NextResponse } from "next/server";

// GET /api/cards/images — return all card images + any updated translations from D1
export async function GET(request: NextRequest) {
  try {
    const symbol = Symbol.for("__cloudflare-context__");
    const ctx = (globalThis as any)[symbol];
    const env = ctx?.env;

    if (!env?.DB) {
      return NextResponse.json({ images: {}, labels: {} });
    }

    // Fetch images
    const imgResult = await env.DB.prepare(
      `SELECT card_id, variant, r2_key FROM card_images`
    ).all();

    const R2_PUBLIC = "https://cdn.visualschedule.app";
    const images: Record<string, Record<string, string>> = {};
    for (const row of (imgResult.results || [])) {
      const r = row as { card_id: string; variant: string; r2_key: string };
      if (!images[r.card_id]) images[r.card_id] = {};
      images[r.card_id][r.variant] = `${R2_PUBLIC}/${r.r2_key}`;
    }

    // Fetch translations (overrides from D1 take priority over static JSON)
    const transResult = await env.DB.prepare(
      `SELECT card_id, lang, label FROM card_translations`
    ).all();

    const labels: Record<string, Record<string, string>> = {};
    for (const row of (transResult.results || [])) {
      const r = row as { card_id: string; lang: string; label: string };
      if (!labels[r.card_id]) labels[r.card_id] = {};
      labels[r.card_id][r.lang] = r.label;
    }

    return NextResponse.json({ images, labels }, {
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
  } catch {
    return NextResponse.json({ images: {}, labels: {} });
  }
}
