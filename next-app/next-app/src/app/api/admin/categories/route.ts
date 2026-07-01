import { NextRequest, NextResponse } from "next/server";

function getEnv(): { DB?: any } {
  const symbol = Symbol.for("__cloudflare-context__");
  const ctx = (globalThis as any)[symbol];
  return ctx?.env || {};
}

// One-time bootstrap so existing cards keep category names. After this runs
// once, categories are entirely admin-defined in the DB — nothing here is a
// hardcoded UI value; it only seeds an empty table.
const SEED_CATEGORIES = [
  { id: "daily", name: "Daily", isFree: 1, sortOrder: 0 },
  { id: "school", name: "School", isFree: 0, sortOrder: 1 },
  { id: "therapy", name: "Therapy", isFree: 0, sortOrder: 2 },
  { id: "meals", name: "Meals", isFree: 0, sortOrder: 3 },
  { id: "social", name: "Social", isFree: 0, sortOrder: 4 },
  { id: "art", name: "Art", isFree: 0, sortOrder: 5 },
  { id: "home", name: "Home", isFree: 0, sortOrder: 6 },
];

async function seedIfEmpty(DB: any) {
  const row = await DB.prepare(`SELECT COUNT(*) AS n FROM categories`).first();
  if (row && Number(row.n) === 0) {
    for (const c of SEED_CATEGORIES) {
      await DB.prepare(
        `INSERT INTO categories (id, name, is_free, enabled, sort_order)
         VALUES (?, ?, ?, 1, ?)`
      ).bind(c.id, c.name, c.isFree, c.sortOrder).run();
    }
  }
}

// GET /api/admin/categories — list all categories from D1
export async function GET() {
  try {
    const env = getEnv();
    if (!env.DB) {
      return NextResponse.json({ categories: [], source: "fallback" }, { status: 200 });
    }

    await seedIfEmpty(env.DB);

    const result = await env.DB.prepare(
      `SELECT id, name, is_free, enabled, sort_order
         FROM categories
        WHERE enabled = 1
        ORDER BY sort_order ASC, name ASC`
    ).all();

    const categories = (result.results || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      isFree: c.is_free === 1,
      sortOrder: c.sort_order ?? 0,
    }));

    return NextResponse.json(
      { categories, source: "database", count: categories.length },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Categories fetch error:", err);
    return NextResponse.json(
      { categories: [], source: "error", error: err?.message || "Failed to fetch categories" },
      { status: 200 }
    );
  }
}

// POST /api/admin/categories — add a single new category
export async function POST(request: NextRequest) {
  try {
    const { id, name, isFree, sortOrder } = await request.json();

    if (!id || !name) {
      return NextResponse.json({ error: "id and name are required" }, { status: 400 });
    }

    const env = getEnv();
    if (!env.DB) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const existing = await env.DB.prepare(
      `SELECT id FROM categories WHERE id = ?`
    ).bind(id).first();

    if (existing) {
      return NextResponse.json(
        { error: `Category "${id}" already exists. Choose a different name.` },
        { status: 409 }
      );
    }

    await env.DB.prepare(
      `INSERT INTO categories (id, name, is_free, enabled, sort_order)
       VALUES (?, ?, ?, 1, ?)`
    ).bind(id, name, isFree ? 1 : 0, sortOrder ?? 0).run();

    return NextResponse.json(
      { success: true, id, name, isFree: !!isFree, message: "Category created" },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Category create error:", err);
    if (err?.message?.includes("UNIQUE")) {
      return NextResponse.json(
        { error: "A category with this name already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: err?.message || "Failed to create category" }, { status: 500 });
  }
}

// PUT /api/admin/categories — replace the full category list (the "Save" button)
export async function PUT(request: NextRequest) {
  try {
    const { categories } = await request.json();

    if (!Array.isArray(categories)) {
      return NextResponse.json({ error: "categories must be an array" }, { status: 400 });
    }

    const env = getEnv();
    if (!env.DB) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    // Wipe and re-insert. category_id on cards is a plain text field (no FK),
    // so this does not break existing card→category links.
    await env.DB.prepare(`DELETE FROM categories`).run();

    let order = 0;
    for (const c of categories) {
      if (!c?.id || !c?.name) continue;
      await env.DB.prepare(
        `INSERT INTO categories (id, name, is_free, enabled, sort_order)
         VALUES (?, ?, ?, 1, ?)`
      ).bind(c.id, c.name, c.isFree ? 1 : 0, c.sortOrder ?? order).run();
      order++;
    }

    return NextResponse.json(
      { success: true, updated: categories.length, message: "Categories saved" },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Categories save error:", err);
    return NextResponse.json({ error: err?.message || "Failed to save categories" }, { status: 500 });
  }
}
