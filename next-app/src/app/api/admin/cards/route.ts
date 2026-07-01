import { NextRequest, NextResponse } from "next/server";

function getEnv(): { DB?: any } {
  const symbol = Symbol.for("__cloudflare-context__");
  const ctx = (globalThis as any)[symbol];
  return ctx?.env || {};
}

// Parse icon field: "free:s-star" → { isFree: true, icon: "s-star" }
function parseIcon(raw: string): { isFree: boolean; icon: string } {
  if (raw?.startsWith("free:")) return { isFree: true, icon: raw.slice(5) };
  if (raw?.startsWith("paid:")) return { isFree: false, icon: raw.slice(5) };
  return { isFree: false, icon: raw || "s-star" };
}

// Build icon field: { isFree: true, icon: "s-star" } → "free:s-star"
function buildIcon(icon: string, isFree: boolean): string {
  const base = icon.replace(/^(free|paid):/, "");
  return `${isFree ? "free" : "paid"}:${base}`;
}

// GET /api/admin/cards — list all cards from D1
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
            FROM card_translations ct WHERE ct.card_id = c.id) AS labels,
         (SELECT GROUP_CONCAT(DISTINCT ci.variant)
            FROM card_images ci WHERE ci.card_id = c.id) AS variants
       FROM cards c
       WHERE c.status = 'live'
       ORDER BY c.sort_order ASC, c.id ASC`
    ).all();

    const cards = (result.results || []).map((row: any) => {
      const translations: Record<string, string> = {};
      if (row.labels) {
        for (const pair of String(row.labels).split(";;;")) {
          const idx = pair.indexOf(":::");
          if (idx > -1) translations[pair.slice(0, idx)] = pair.slice(idx + 3);
        }
      }
      const variantList = row.variants ? String(row.variants).split(",") : [];
      const isCharacter = variantList.some((v: string) => ["boy","girl","brown"].includes(v));
      const { isFree, icon } = parseIcon(row.icon);

      return {
        id: row.id,
        icon,
        isFree,
        categoryId: row.category_id,
        sortOrder: row.sort_order ?? 0,
        isCharacter,
        translations: Object.keys(translations).length ? translations : { en: row.id },
      };
    });

    return NextResponse.json({ cards, source: "database", count: cards.length }, { status: 200 });
  } catch (err: any) {
    console.error("Cards fetch error:", err);
    return NextResponse.json({ cards: [], source: "error", error: err?.message }, { status: 200 });
  }
}

// POST /api/admin/cards — create a new card
export async function POST(request: NextRequest) {
  try {
    const { id, icon, isFree, categoryId, isCharacter, translations } = await request.json();

    if (!id || !categoryId || !translations?.en) {
      return NextResponse.json(
        { error: "id, categoryId, and translations.en are required" },
        { status: 400 }
      );
    }

    const env = getEnv();
    if (!env.DB) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const existing = await env.DB.prepare(`SELECT id FROM cards WHERE id = ?`).bind(id).first();
    if (existing) {
      return NextResponse.json(
        { error: `Card "${id}" already exists. Choose a different name.` },
        { status: 409 }
      );
    }

    const iconField = buildIcon(icon || "s-star", !!isFree);

    await env.DB.prepare(
      `INSERT INTO cards (id, icon, category_id, status, sort_order, created_at)
       VALUES (?, ?, ?, 'live', 0, datetime('now'))`
    ).bind(id, iconField, categoryId).run();

    await env.DB.prepare(
      `INSERT INTO card_translations (card_id, lang, label) VALUES (?, 'en', ?)`
    ).bind(id, translations.en).run();

    if (translations.hi && translations.hi !== translations.en) {
      await env.DB.prepare(
        `INSERT INTO card_translations (card_id, lang, label) VALUES (?, 'hi', ?)`
      ).bind(id, translations.hi).run();
    }

    return NextResponse.json(
      { success: true, id, isFree: !!isFree, message: "Card created!" },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Card creation error:", err);
    if (err?.message?.includes("UNIQUE")) {
      return NextResponse.json(
        { error: "A card with this ID already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: err?.message || "Failed to create card" }, { status: 500 });
  }
}
