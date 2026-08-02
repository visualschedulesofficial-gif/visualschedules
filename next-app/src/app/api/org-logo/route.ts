import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/admin-auth";

export const runtime = "nodejs";

const SESSION_COOKIE = "vs_session";
const ORG_COOKIE = "vs_org";

// GET /api/org-logo — streams the current visitor's center logo through our
// own domain. Same-origin means the browser renders it without CORS drama
// AND the PDF/JPEG capture engine can include it cleanly.
export async function GET() {
  try {
    const env = getEnv();
    if (!env.DB) return new NextResponse(null, { status: 404 });
    const cookieStore = await cookies();

    let logoUrl: string | null = null;

    const orgCookie = cookieStore.get(ORG_COOKIE);
    if (orgCookie?.value) {
      try {
        const { orgId } = JSON.parse(Buffer.from(orgCookie.value, "base64").toString());
        if (orgId) {
          const org = await env.DB.prepare(
            "SELECT logo_url FROM orgs WHERE id = ? AND active = 1"
          ).bind(orgId).first();
          if (org?.logo_url) logoUrl = org.logo_url as string;
        }
      } catch {}
    }

    if (!logoUrl) {
      const session = cookieStore.get(SESSION_COOKIE);
      if (session?.value) {
        try {
          const data = JSON.parse(Buffer.from(session.value, "base64").toString());
          if (data.userId) {
            const user = await env.DB.prepare("SELECT email FROM users WHERE id = ?")
              .bind(data.userId).first();
            if (user?.email) {
              const org = await env.DB.prepare(
                `SELECT o.logo_url FROM org_members m
                 JOIN orgs o ON o.id = m.org_id
                 WHERE m.email = ? AND o.active = 1`
              ).bind((user.email as string).toLowerCase()).first();
              if (org?.logo_url) logoUrl = org.logo_url as string;
            }
          }
        } catch {}
      }
    }

    if (!logoUrl) return new NextResponse(null, { status: 404 });

    // Absolute URL -> fetch and stream; relative (already same-origin) -> redirect
    if (!/^https?:\/\//i.test(logoUrl)) {
      return NextResponse.redirect(new URL(logoUrl, "https://visualschedule.app"));
    }
    const upstream = await fetch(logoUrl);
    if (!upstream.ok) return new NextResponse(null, { status: 404 });
    const contentType = upstream.headers.get("content-type") || "image/png";
    const bytes = await upstream.arrayBuffer();
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=30",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
