import { NextResponse } from "next/server";
import { getEnv } from "@/lib/admin-auth";

// GET /api/downloads — full public tree: bundles → items → files
export async function GET() {
  const env = getEnv();
  if (!env.DB) return NextResponse.json({ bundles: [] });

  const bundles = await env.DB.prepare(
    "SELECT id, title, description FROM download_bundles WHERE enabled = 1 ORDER BY sort_order, title"
  ).all();
  const items = await env.DB.prepare(
    "SELECT id, bundle_id, title, description FROM download_items WHERE enabled = 1 ORDER BY sort_order, title"
  ).all();
  const files = await env.DB.prepare(
    "SELECT id, item_id, variant, label, file_url, preview_url FROM download_files ORDER BY sort_order, variant"
  ).all();

  return NextResponse.json({
    bundles: (bundles.results || []).map((b: any) => ({
      ...b,
      items: (items.results || [])
        .filter((i: any) => i.bundle_id === b.id)
        .map((i: any) => ({
          ...i,
          files: (files.results || []).filter((f: any) => f.item_id === i.id),
        })),
    })),
  });
}
