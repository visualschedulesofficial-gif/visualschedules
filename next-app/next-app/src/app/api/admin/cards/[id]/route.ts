import { NextRequest, NextResponse } from "next/server";

function getEnv(): { DB?: any; R2?: any } {
  const symbol = Symbol.for("__cloudflare-context__");
  const ctx = (globalThis as any)[symbol];
  return ctx?.env || {};
}

// DELETE /api/admin/cards/:id — delete a card and its images
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const env = getEnv();

  if (!env.DB) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  try {
    // Delete images from R2
    if (env.R2) {
      const images = await env.DB.prepare(
        `SELECT r2_key FROM card_images WHERE card_id = ?`
      ).bind(id).all();

      for (const img of (images.results || [])) {
        await env.R2.delete((img as any).r2_key).catch(() => {});
      }
    }

    // Delete from D1 (cascades handle card_images, card_translations)
    await env.DB.prepare(`DELETE FROM card_images WHERE card_id = ?`).bind(id).run();
    await env.DB.prepare(`DELETE FROM card_translations WHERE card_id = ?`).bind(id).run();
    await env.DB.prepare(`DELETE FROM cards WHERE id = ?`).bind(id).run();

    return NextResponse.json({ success: true, deleted: id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Delete failed" }, { status: 500 });
  }
}

// PUT /api/admin/cards/:id — update card name/category (kept for compatibility)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const env = getEnv();

  if (!env.DB) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  try {
    const { name, categoryId } = await request.json();

    if (name) {
      await env.DB.prepare(`DELETE FROM card_translations WHERE card_id = ? AND lang = 'en'`).bind(id).run();
      await env.DB.prepare(
        `INSERT INTO card_translations (card_id, lang, label) VALUES (?, 'en', ?)`
      ).bind(id, name).run();
    }

    if (categoryId) {
      await env.DB.prepare(
        `UPDATE cards SET category_id = ? WHERE id = ?`
      ).bind(categoryId, id).run();
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Update failed" }, { status: 500 });
  }
}

// PATCH /api/admin/cards/:id — full edit: icon, category, and EN/HI labels.
// Used by the Edit Card form. Replaces translation rows so repeated edits
// never create duplicates.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const env = getEnv();

  if (!env.DB) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  try {
    const { icon, categoryId, translations } = await request.json();

    // Confirm the card exists
    const existing = await env.DB.prepare(`SELECT id FROM cards WHERE id = ?`).bind(id).first();
    if (!existing) {
      return NextResponse.json({ error: `Card "${id}" not found` }, { status: 404 });
    }

    if (typeof icon === "string" && icon) {
      await env.DB.prepare(`UPDATE cards SET icon = ? WHERE id = ?`).bind(icon, id).run();
    }

    if (typeof categoryId === "string" && categoryId) {
      await env.DB.prepare(`UPDATE cards SET category_id = ? WHERE id = ?`).bind(categoryId, id).run();
    }

    if (translations && typeof translations === "object") {
      for (const [lang, label] of Object.entries(translations)) {
        if (typeof label !== "string" || !label) continue;
        // Replace any existing row(s) for this language with one clean row
        await env.DB.prepare(
          `DELETE FROM card_translations WHERE card_id = ? AND lang = ?`
        ).bind(id, lang).run();
        await env.DB.prepare(
          `INSERT INTO card_translations (card_id, lang, label) VALUES (?, ?, ?)`
        ).bind(id, lang, label).run();
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("Card update (PATCH) error:", err);
    return NextResponse.json({ error: err?.message || "Update failed" }, { status: 500 });
  }
}
