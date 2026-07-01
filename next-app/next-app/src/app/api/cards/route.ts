import { NextResponse } from "next/server";

function getEnv(): { DB?: any } {
  const symbol = Symbol.for("__cloudflare-context__");
  const ctx = (globalThis as any)[symbol];
  return ctx?.env || {};
}

// GET /api/cards — public list of live cards (used by the schedule builder
// sidebar). Returns DB cards; the client merges these with its static seed
// cards so both admin-added and built-in cards show.
export async function GET() {
  try {
    const env = getEnv();
    if (!env.DB) {
      return NextResponse.json({ cards: [], source: "fallback" }, { status: 200 });
    }

    const result = await env.DB.prepare(
      `SELECT
         c.id,
         c.icon,
         c.category_id,
         c.sort_order,
         (SELECT GROUP_CONCAT(ct.lang || ':::' || ct.label, ';;;')
            FROM card_translations ct
           WHERE ct.card_id = c.id) AS labels,
         (SELECT GROUP_CONCAT(DISTINCT ci.variant)
            FROM card_images ci
           WHERE ci.card_id = c.id) AS variants
       FROM cards c
       WHERE c.status = 'live'
       ORDER BY c.sort_order ASC, c.id ASC`
    ).all();

    const cards = (result.results || []).map((row: any) => {
      const translations: Record<string, string> = {};
      if (row.labels) {
        for (const pair of String(row.labels).split(";;;")) {
          const idx = pair.indexOf(":::");
          if (idx > -1) {
            const lang = pair.slice(0, idx);
            const label = pair.slice(idx + 3);
            if (lang) translations[lang] = label;
          }
        }
      }
      const variantList = row.variants ? String(row.variants).split(",") : [];
      const isCharacter = variantList.some((v) => v === "boy" || v === "girl" || v === "brown");

      return {
        id: row.id,
        icon: row.icon || "star",
        categoryId: row.category_id,
        sortOrder: row.sort_order ?? 0,
        isCharacter,
        translations: Object.keys(translations).length ? translations : { en: row.id },
      };
    });

    return NextResponse.json(
      { cards, source: "database", count: cards.length },
      { headers: { "Cache-Control": "no-cache, no-store, must-revalidate" } }
    );
  } catch (err: any) {
    console.error("Public cards fetch error:", err);
    return NextResponse.json({ cards: [], source: "error" }, { status: 200 });
  }
}
