import { NextRequest, NextResponse } from "next/server";

function getEnv(): { DB?: any } {
  const symbol = Symbol.for("__cloudflare-context__");
  const ctx = (globalThis as any)[symbol];
  return ctx?.env || {};
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
