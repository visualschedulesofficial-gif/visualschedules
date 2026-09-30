import { NextRequest, NextResponse } from "next/server";
import { withEdgeCache } from "@/lib/edge-cache";

// GET /api/images/cards/wake/neutral.jpg — serve image from R2
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const key = path.join("/");
  return withEdgeCache(request, () => fromR2(key));
}

async function fromR2(key: string): Promise<Response> {
  try {
    // Access Cloudflare bindings via the global context symbol
    const symbol = Symbol.for("__cloudflare-context__");
    const ctx = (globalThis as any)[symbol];
    const env = ctx?.env;

    if (!env?.R2) {
      return NextResponse.json({ error: "R2 not available" }, { status: 503 });
    }

    const object = await env.R2.get(key);
    if (!object) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType || "image/jpeg");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    if (object.httpEtag) headers.set("ETag", object.httpEtag);

    return new NextResponse(object.body, { headers });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
  }
}
