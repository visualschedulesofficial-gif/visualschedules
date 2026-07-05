import { NextRequest, NextResponse } from "next/server";
import { getEnv, requireAdmin } from "@/lib/admin-auth";

// GET — full tree incl. disabled
export async function GET() {
  const env = getEnv();
  if (!(await requireAdmin(env))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bundles = await env.DB.prepare(
    "SELECT * FROM download_bundles ORDER BY sort_order, title"
  ).all();
  const items = await env.DB.prepare(
    "SELECT * FROM download_items ORDER BY sort_order, title"
  ).all();
  const files = await env.DB.prepare(
    "SELECT * FROM download_files ORDER BY sort_order, variant"
  ).all();
  return NextResponse.json({
    bundles: bundles.results || [],
    items: items.results || [],
    files: files.results || [],
  });
}

// POST — create { kind: "bundle"|"item"|"file", ...fields }
export async function POST(request: NextRequest) {
  const env = getEnv();
  if (!(await requireAdmin(env))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.kind) return NextResponse.json({ error: "kind required" }, { status: 400 });
  const id = crypto.randomUUID();

  if (body.kind === "bundle") {
    if (!body.title) return NextResponse.json({ error: "title required" }, { status: 400 });
    await env.DB.prepare(
      "INSERT INTO download_bundles (id, title, description, sort_order) VALUES (?, ?, ?, ?)"
    ).bind(id, body.title, body.description || null, body.sortOrder ?? 0).run();
  } else if (body.kind === "item") {
    if (!body.title || !body.bundleId)
      return NextResponse.json({ error: "title and bundleId required" }, { status: 400 });
    await env.DB.prepare(
      "INSERT INTO download_items (id, bundle_id, title, description, sort_order) VALUES (?, ?, ?, ?, ?)"
    ).bind(id, body.bundleId, body.title, body.description || null, body.sortOrder ?? 0).run();
  } else if (body.kind === "file") {
    if (!body.itemId || !body.variant || !body.fileUrl)
      return NextResponse.json({ error: "itemId, variant, fileUrl required" }, { status: 400 });
    await env.DB.prepare(
      "INSERT INTO download_files (id, item_id, variant, label, file_url, preview_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, body.itemId, body.variant, body.label || null, body.fileUrl, body.previewUrl || null, body.sortOrder ?? 0).run();
  } else {
    return NextResponse.json({ error: "unknown kind" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id });
}

// PUT — update { kind, id, ...fields }
export async function PUT(request: NextRequest) {
  const env = getEnv();
  if (!(await requireAdmin(env))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.kind || !body?.id) return NextResponse.json({ error: "kind and id required" }, { status: 400 });

  if (body.kind === "bundle") {
    await env.DB.prepare(
      "UPDATE download_bundles SET title = ?, description = ?, sort_order = ?, enabled = ? WHERE id = ?"
    ).bind(body.title, body.description || null, body.sortOrder ?? 0, body.enabled ? 1 : 0, body.id).run();
  } else if (body.kind === "item") {
    await env.DB.prepare(
      "UPDATE download_items SET title = ?, description = ?, sort_order = ?, enabled = ? WHERE id = ?"
    ).bind(body.title, body.description || null, body.sortOrder ?? 0, body.enabled ? 1 : 0, body.id).run();
  } else if (body.kind === "file") {
    await env.DB.prepare(
      "UPDATE download_files SET variant = ?, label = ?, sort_order = ? WHERE id = ?"
    ).bind(body.variant, body.label || null, body.sortOrder ?? 0, body.id).run();
  }
  return NextResponse.json({ ok: true });
}

// DELETE — { kind, id }
export async function DELETE(request: NextRequest) {
  const env = getEnv();
  if (!(await requireAdmin(env))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.kind || !body?.id) return NextResponse.json({ error: "kind and id required" }, { status: 400 });
  const table =
    body.kind === "bundle" ? "download_bundles" :
    body.kind === "item" ? "download_items" : "download_files";
  await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(body.id).run();
  return NextResponse.json({ ok: true });
}
