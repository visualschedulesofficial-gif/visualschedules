import { NextResponse } from "next/server";
import { getEnv } from "@/lib/admin-auth";

// GET /api/templates — every admin-curated template. Public: no personal
// login required, since these are meant for any visitor to browse and start
// from, the same way the old hardcoded Templates screen was.
export async function GET() {
  const env = getEnv();
  if (!env.DB) return NextResponse.json({ templates: [] });

  try {
    const result = await env.DB.prepare(
      // `data` is needed to work out a thumbnail; only the first card's id is
      // sent back, never the whole payload.
      `SELECT id, title, schedule_type, language, gender, updated_at, data
       FROM schedules
       WHERE is_template = 1
       ORDER BY updated_at DESC`
    ).all();

    // First card in the saved data becomes the thumbnail. Checks BOTH shapes
    // (slots and columns) — a page can carry an empty slots array alongside a
    // populated columns map.
    const firstCardId = (raw: string | null): string | null => {
      if (!raw) return null;
      try {
        const data = JSON.parse(raw);
        for (const page of data?.pages || []) {
          if (Array.isArray(page?.slots)) {
            const hit = page.slots.find((x: any) => x?.cardId);
            if (hit) return hit.cardId;
          }
          for (const col of Object.values(page?.columns || {})) {
            const hit = (col as any[])?.find((c: any) => c?.cardId);
            if (hit) return hit.cardId;
          }
        }
      } catch {}
      return null;
    };

    const templates = (result.results || []).map((r: any) => ({
      id: r.id,
      title: r.title,
      scheduleType: r.schedule_type,
      language: r.language,
      gender: r.gender,
      updatedAt: r.updated_at,
      coverCardId: firstCardId(r.data as string | null),
    }));

    return NextResponse.json({ templates });
  } catch (err: any) {
    return NextResponse.json({ templates: [], error: err?.message });
  }
}
