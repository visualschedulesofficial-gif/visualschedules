import { NextRequest, NextResponse } from "next/server";
import { getEnv, requireAdmin } from "@/lib/admin-auth";
import { cleanCourse, getCourse, saveCourse } from "@/lib/course";

export async function GET() {
  const env = getEnv();
  if (!(await requireAdmin(env))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ course: await getCourse(env.DB) });
}

export async function PUT(request: NextRequest) {
  const env = getEnv();
  if (!(await requireAdmin(env))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.course) return NextResponse.json({ error: "course required" }, { status: 400 });
  try {
    await saveCourse(env.DB, cleanCourse(body.course));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Save failed" }, { status: 500 });
  }
}
