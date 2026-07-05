import { NextResponse } from "next/server";
import { getEnv, requireAdmin } from "@/lib/admin-auth";

// POST multipart: { folder: "downloads"|"blog", file }
// Stores in R2, returns a public CDN URL.
export async function POST(request: Request) {
  const env = getEnv();
  if (!(await requireAdmin(env))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bucket = (env as any).R2 || (env as any).R2_BUCKET;
  if (!bucket) return NextResponse.json({ error: "Storage not configured" }, { status: 500 });

  const formData = await request.formData();
  const folder = (formData.get("folder") as string) || "downloads";
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });
  if (!["downloads", "blog"].includes(folder)) {
    return NextResponse.json({ error: "invalid folder" }, { status: 400 });
  }

  const safeName = (file.name || "file")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const key = `${folder}/${Date.now()}-${safeName}`;
  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });

  return NextResponse.json({ ok: true, url: `https://cdn.visualschedule.app/${key}` });
}
