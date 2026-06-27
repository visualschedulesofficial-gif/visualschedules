import { NextRequest, NextResponse } from "next/server";

// GET /api/images/cards/wake/neutral.jpg — serve image from R2
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const key = path.join("/");

  const env = (process as any).env;

  if (env?.R2) {
    const object = await env.R2.get(key);
    if (!object) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType || "image/jpeg");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(object.body, { headers });
  }

  return NextResponse.json({ error: "R2 not available" }, { status: 503 });
}
