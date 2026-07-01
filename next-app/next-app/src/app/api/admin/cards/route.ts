import { NextRequest, NextResponse } from "next/server";

function getEnv(): { DB?: any } {
  const symbol = Symbol.for("__cloudflare-context__");
  const ctx = (globalThis as any)[symbol];
  return ctx?.env || {};
}

// GET /api/admin/cards — list all cards (with translations) from D1
export async function GET() {
  try {
    const env = getEnv();

    // No DB available → tell the client to use its static fallback
    if (!env.DB) {
      return NextResponse.json({ cards: [], source: "fallback" }, { status: 200 });
    }

    // One row per card. Translations and image variants are pulled via
    // correlated subqueries so cards with no images/translations still appear.
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
      // Parse "en:::Wake Up;;;hi:::उठना" → { en: "Wake Up", hi: "उठना" }
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

      // A card is a "character" card if it has any non-neutral image variant.
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
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Cards fetch error:", err);
    // On error, return empty so the client falls back to static cards
    return NextResponse.json(
      { cards: [], source: "error", error: err?.message || "Failed to fetch cards" },
      { status: 200 }
    );
  }
}

// POST /api/admin/cards — create a new card or update existing
export async function POST(request: NextRequest) {
  try {
    const { id, icon, categoryId, isCharacter, translations } = await request.json();

    if (!id || !categoryId || !translations?.en) {
      return NextResponse.json(
        { error: "id, categoryId, and translations.en are required" },
        { status: 400 }
      );
    }

    const env = getEnv();

    if (env.DB) {
      // Check if card already exists
      const existing = await env.DB.prepare(
        `SELECT id FROM cards WHERE id = ?`
      ).bind(id).first();

      if (existing) {
        // Card already exists - return clear error
        return NextResponse.json(
          { error: `Card with ID "${id}" already exists. Choose a different name or ID.` },
          { status: 409 }
        );
      }

      // Insert new card
      await env.DB.prepare(
        `INSERT INTO cards (id, icon, category_id, status, sort_order, created_at) 
         VALUES (?, ?, ?, 'live', 0, datetime('now'))`
      ).bind(id, icon || "star", categoryId).run();

      // Insert English translation
      await env.DB.prepare(
        `INSERT INTO card_translations (card_id, lang, label) VALUES (?, 'en', ?)`
      ).bind(id, translations.en).run();

      // Insert Hindi translation if provided
      if (translations.hi && translations.hi !== translations.en) {
        await env.DB.prepare(
          `INSERT INTO card_translations (card_id, lang, label) VALUES (?, 'hi', ?)`
        ).bind(id, translations.hi).run();
      }

      return NextResponse.json(
        { success: true, id, cardId: id, translations, message: "Card created successfully!" },
        { status: 201 }
      );
    }

    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  } catch (err: any) {
    console.error("Card creation error:", err);
    
    // Handle constraint errors
    if (err?.message?.includes("UNIQUE")) {
      return NextResponse.json(
        { error: "A card with this name already exists. Try a different name." },
        { status: 409 }
      );
    }
    
    return NextResponse.json({ error: err?.message || "Failed to create card" }, { status: 500 });
  }
}
