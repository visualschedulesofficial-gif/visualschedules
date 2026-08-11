import { NextResponse } from "next/server";
import { getEnv } from "@/lib/admin-auth";

// GET /api/downloads — full public tree: bundles → items → files
//
// This endpoint is deliberately defensive. Two separate things have silently
// emptied this page in the past, both invisible to the admin panel (which
// uses SELECT * and no enabled filter, so it kept showing everything):
//
//   1. A migration that never ran against the remote DB, so view_count /
//      download_count didn't exist and the whole query threw.
//   2. Rows written with enabled = NULL, which `enabled = 1` filters out.
//
// So: the counter columns are probed once and dropped from the query if
// missing, and enabled is read via COALESCE so NULL counts as visible.
// Only an explicit enabled = 0 hides something.
export async function GET() {
  const env = getEnv();
  if (!env.DB) return NextResponse.json({ bundles: [] });

  const notes: string[] = [];

  try {
    // Do the stats columns actually exist on this database?
    let hasStats = true;
    try {
      await env.DB.prepare("SELECT view_count, download_count FROM download_files LIMIT 1").all();
    } catch {
      hasStats = false;
      notes.push("download_files is missing view_count/download_count — migration 0010 has not been applied. Counts show as 0.");
    }

    const bundles = await env.DB.prepare(
      "SELECT id, title, description FROM download_bundles WHERE COALESCE(enabled, 1) = 1 ORDER BY sort_order, title"
    ).all();
    const items = await env.DB.prepare(
      "SELECT id, bundle_id, title, description FROM download_items WHERE COALESCE(enabled, 1) = 1 ORDER BY sort_order, title"
    ).all();

    const fileCols = hasStats
      ? "id, item_id, variant, label, file_url, preview_url, character, language, COALESCE(view_count,0) as view_count, COALESCE(download_count,0) as download_count"
      : "id, item_id, variant, label, file_url, preview_url, character, language, 0 as view_count, 0 as download_count";
    const files = await env.DB.prepare(
      `SELECT ${fileCols} FROM download_files ORDER BY sort_order, variant`
    ).all();

    const bundleRows = bundles.results || [];
    const itemRows = items.results || [];
    const fileRows = files.results || [];

    // If there's data in the tables but nothing survived the filters, say so
    // in the response rather than rendering a bare "No downloads yet".
    if (bundleRows.length === 0) {
      const total = await env.DB.prepare("SELECT COUNT(*) as n FROM download_bundles").all();
      const n = (total.results?.[0] as any)?.n ?? 0;
      if (n > 0) notes.push(`${n} categories exist but all have enabled = 0.`);
    }

    return NextResponse.json({
      bundles: bundleRows.map((b: any) => ({
        ...b,
        items: itemRows
          .filter((i: any) => i.bundle_id === b.id)
          .map((i: any) => ({
            ...i,
            files: fileRows.filter((f: any) => f.item_id === i.id),
          })),
      })),
      ...(notes.length ? { notes } : {}),
    });
  } catch (err: any) {
    // Never swallow this — an empty page with no explanation is what made
    // the two bugs above so hard to find.
    return NextResponse.json({ bundles: [], error: String(err?.message || err) }, { status: 500 });
  }
}
