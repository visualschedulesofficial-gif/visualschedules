import { NextRequest, NextResponse } from "next/server";
import { getEnv, requireAdmin } from "@/lib/admin-auth";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export async function GET() {
  const env = getEnv();
  if (!(await requireAdmin(env))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { results } = await env.DB.prepare(
    "SELECT * FROM blog_posts ORDER BY created_at DESC"
  ).all();
  return NextResponse.json({ posts: results || [] });
}

export async function POST(request: NextRequest) {
  const env = getEnv();
  if (!(await requireAdmin(env))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await request.json().catch(() => null);
  if (!b?.title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const id = b.id || crypto.randomUUID();
  const slug = slugify(b.slug || b.title);
  if (!slug) return NextResponse.json({ error: "slug could not be generated" }, { status: 400 });
  const status = b.status === "published" ? "published" : "draft";

  const existing = b.id
    ? await env.DB.prepare("SELECT id, published_at FROM blog_posts WHERE id = ?").bind(b.id).first()
    : null;

  // First time a post goes live, stamp published_at (kept stable afterwards)
  const publishedAt =
    status === "published"
      ? existing?.published_at || new Date().toISOString()
      : existing?.published_at || null;

  if (existing) {
    await env.DB.prepare(
      `UPDATE blog_posts SET slug=?, title=?, meta_description=?, keywords=?, cover_url=?, content=?, status=?, published_at=?, updated_at=datetime('now') WHERE id=?`
    ).bind(slug, b.title, b.metaDescription || null, b.keywords || null, b.coverUrl || null, b.content || "", status, publishedAt, b.id).run();
  } else {
    await env.DB.prepare(
      `INSERT INTO blog_posts (id, slug, title, meta_description, keywords, cover_url, content, status, published_at) VALUES (?,?,?,?,?,?,?,?,?)`
    ).bind(id, slug, b.title, b.metaDescription || null, b.keywords || null, b.coverUrl || null, b.content || "", status, publishedAt).run();
  }
  return NextResponse.json({ ok: true, id, slug });
}

export async function DELETE(request: NextRequest) {
  const env = getEnv();
  if (!(await requireAdmin(env))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await request.json().catch(() => null);
  if (!b?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await env.DB.prepare("DELETE FROM blog_posts WHERE id = ?").bind(b.id).run();
  return NextResponse.json({ ok: true });
}
