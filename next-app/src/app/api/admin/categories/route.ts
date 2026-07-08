import { NextRequest, NextResponse } from "next/server";

function getEnv(): { DB?: any } {
  const symbol = Symbol.for("__cloudflare-context__");
  const ctx = (globalThis as any)[symbol];
  return ctx?.env || {};
}

const SEED_CATEGORIES = [
  { id: "daily",   name: "Daily",   sortOrder: 0 },
  { id: "school",  name: "School",  sortOrder: 1 },
  { id: "therapy", name: "Therapy", sortOrder: 2 },
  { id: "meals",   name: "Meals",   sortOrder: 3 },
  { id: "social",  name: "Social",  sortOrder: 4 },
  { id: "art",     name: "Art",     sortOrder: 5 },
  { id: "home",    name: "Home",    sortOrder: 6 },
];

async function seedIfEmpty(DB: any) {
  const row = await DB.prepare(`SELECT COUNT(*) AS n FROM categories`).first();
  if (row && Number(row.n) === 0) {
    for (const c of SEED_CATEGORIES) {
      await DB.prepare(
        `INSERT INTO categories (id, name, enabled, sort_order) VALUES (?, ?, 1, ?)`
      ).bind(c.id, c.name, c.sortOrder).run();
    }
  }
}

// GET /api/admin/categories
export async function GET() {
  try {
    const env = getEnv();
    if (!env.DB) {
      return NextResponse.json({ categories: [], source: "fallback" }, { status: 200 });
    }
    await seedIfEmpty(env.DB);
    const result = await env.DB.prepare(
      `SELECT id, name, enabled, sort_order, has_characters FROM categories WHERE enabled = 1 ORDER BY sort_order ASC`
    ).all();
    const categories = (result.results || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      sortOrder: c.sort_order ?? 0,
      hasCharacters: !!c.has_characters,
    }));
    return NextResponse.json({ categories, source: "database" }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ categories: [], source: "error" }, { status: 200 });
  }
}

// POST /api/admin/categories — add one
export async function POST(request: NextRequest) {
  try {
    const { id, name, sortOrder } = await request.json();
    if (!id || !name) {
      return NextResponse.json({ error: "id and name required" }, { status: 400 });
    }
    const env = getEnv();
    if (!env.DB) return NextResponse.json({ error: "Database not available" }, { status: 503 });
    const existing = await env.DB.prepare(`SELECT id FROM categories WHERE id = ?`).bind(id).first();
    if (existing) {
      return NextResponse.json({ error: `Category "${id}" already exists.` }, { status: 409 });
    }
    await env.DB.prepare(
      `INSERT INTO categories (id, name, enabled, sort_order) VALUES (?, ?, 1, ?)`
    ).bind(id, name, sortOrder ?? 0).run();
    return NextResponse.json({ success: true, id, name }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create" }, { status: 500 });
  }
}

// PUT /api/admin/categories — save all
export async function PUT(request: NextRequest) {
  try {
    const { categories } = await request.json();
    if (!Array.isArray(categories)) {
      return NextResponse.json({ error: "categories must be an array" }, { status: 400 });
    }
    const env = getEnv();
    if (!env.DB) return NextResponse.json({ error: "Database not available" }, { status: 503 });
    await env.DB.prepare(`DELETE FROM categories`).run();
    let order = 0;
    for (const c of categories) {
      if (!c?.id || !c?.name) continue;
      await env.DB.prepare(
        `INSERT INTO categories (id, name, enabled, sort_order, has_characters) VALUES (?, ?, 1, ?, ?)`
      ).bind(c.id, c.name, c.sortOrder ?? order, c.hasCharacters ? 1 : 0).run();
      order++;
    }
    return NextResponse.json({ success: true, updated: categories.length }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to save" }, { status: 500 });
  }
}
