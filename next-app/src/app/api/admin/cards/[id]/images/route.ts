import { NextRequest, NextResponse } from "next/server";

function getEnv(): { R2?: any; DB?: any } {
  const symbol = Symbol.for("__cloudflare-context__");
  const ctx = (globalThis as any)[symbol];
  return ctx?.env || {};
}

// POST /api/admin/cards/:id/images — upload an image variant to R2
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cardId } = await params;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const variant = formData.get("variant") as string | null;

    if (!file || !variant) {
      return NextResponse.json({ error: "file and variant are required" }, { status: 400 });
    }

    if (!["neutral", "boy", "girl", "brown"].includes(variant)) {
      return NextResponse.json({ error: "variant must be neutral, boy, girl, or brown" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const contentType = file.type || "image/webp";
    const ext = contentType.includes("png") ? "png" : contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "webp";
    const r2Key = `cards/${cardId}/${variant}.${ext}`;

    const env = getEnv();

    // Upload to R2
    if (env.R2) {
      await env.R2.put(r2Key, buffer, {
        httpMetadata: { contentType },
      });
    } else {
      console.log(`[Upload] R2 binding not available, would upload to: ${r2Key}`);
    }

    const R2_PUBLIC = "https://pub-fb24742caa5749ab9e9bc7a305ebb67f.r2.dev";
    const publicUrl = `${R2_PUBLIC}/${r2Key}`;

    // Store in D1
    if (env.DB) {
      await env.DB.prepare(
        `INSERT OR REPLACE INTO card_images (card_id, variant, r2_key, url) VALUES (?, ?, ?, ?)`
      ).bind(cardId, variant, r2Key, publicUrl).run();
    }

    return NextResponse.json({
      cardId,
      variant,
      r2Key,
      url: publicUrl,
      size: file.size,
    }, { status: 201 });
  } catch (err: any) {
    console.error("[Upload Error]", err?.message || err);
    return NextResponse.json({ error: "Upload failed: " + (err?.message || "unknown") }, { status: 500 });
  }
}

// GET /api/admin/cards/:id/images — list image variants for a card
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cardId } = await params;
  const env = getEnv();

  if (env.DB) {
    const result = await env.DB.prepare(
      `SELECT variant, r2_key, url FROM card_images WHERE card_id = ?`
    ).bind(cardId).all();

    const R2_PUBLIC = "https://pub-fb24742caa5749ab9e9bc7a305ebb67f.r2.dev";
    const images = (result.results || []).map((img: any) => ({
      ...img,
      url: `${R2_PUBLIC}/${img.r2_key}`,
    }));

    return NextResponse.json({ cardId, images });
  }

  return NextResponse.json({ cardId, images: [] });
}
