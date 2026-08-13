import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/admin-auth";

export const runtime = "nodejs";

const SESSION_COOKIE = "vs_session";
const ORG_COOKIE = "vs_org";

// GET /api/me/org — the branding for the current visitor, from either:
//  (a) an active therapist-code session (vs_org cookie), or
//  (b) a signed-in user whose email is linked to a center.
export async function GET() {
  try {
    const env = getEnv();
    if (!env.DB) return NextResponse.json({ org: null, via: null, code: null });
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE);

    // (a) code session. A code entered in the last 15 minutes always
    // applies — that's a deliberate action just taken, even if the visitor
    // also happens to be logged in personally. An OLDER cookie only applies
    // when nobody is logged in, so a forgotten cookie from days ago can't
    // silently brand an unrelated account that signs in later.
    const RECENT_MS = 15 * 60 * 1000;
    const orgCookie = cookieStore.get(ORG_COOKIE);
    if (orgCookie?.value) {
      try {
        const { orgId, redeemedAt } = JSON.parse(Buffer.from(orgCookie.value, "base64").toString());
        const isFresh = typeof redeemedAt === "number" && Date.now() - redeemedAt < RECENT_MS;
        if (orgId && (isFresh || !session?.value)) {
          const org = await env.DB.prepare(
            "SELECT name, logo_url, access_code, plan, plan_expires_at FROM orgs WHERE id = ? AND active = 1"
          ).bind(orgId).first();
          if (org) {
            const isPaid = org.plan === "paid" && (!org.plan_expires_at || (org.plan_expires_at as string) > new Date().toISOString());
            return NextResponse.json({
              org: { name: org.name, logoUrl: org.logo_url, isPaid },
              via: "code",
              code: org.access_code,
            });
          }
        }
      } catch {}
    }

    // (b) signed-in member email
    if (session?.value) {
      try {
        const data = JSON.parse(Buffer.from(session.value, "base64").toString());
        if (data.userId) {
          const user = await env.DB.prepare("SELECT email FROM users WHERE id = ?")
            .bind(data.userId).first();
          if (user?.email) {
            const org = await env.DB.prepare(
              `SELECT o.name, o.logo_url, o.plan, o.plan_expires_at FROM org_members m
               JOIN orgs o ON o.id = m.org_id
               WHERE m.email = ? AND o.active = 1`
            ).bind((user.email as string).toLowerCase()).first();
            if (org) {
              const isPaid = org.plan === "paid" && (!org.plan_expires_at || (org.plan_expires_at as string) > new Date().toISOString());
              return NextResponse.json({
                org: { name: org.name, logoUrl: org.logo_url, isPaid },
                via: "member",
                code: null,
              });
            }
          }
        }
      } catch {}
    }

    return NextResponse.json({ org: null, via: null, code: null });
  } catch {
    return NextResponse.json({ org: null });
  }
}

// DELETE /api/me/org — leave the current access-code session.
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ORG_COOKIE);
  return NextResponse.json({ ok: true });
}

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // matches the OTP-login session

// POST /api/me/org — redeem a therapist access code; sets a 90-day session.
export async function POST(request: NextRequest) {
  try {
    const env = getEnv();
    const { code } = await request.json();
    if (!code || !env.DB) return NextResponse.json({ error: "Code required" }, { status: 400 });

    const org = await env.DB.prepare(
      "SELECT id, name, logo_url FROM orgs WHERE UPPER(access_code) = UPPER(?) AND active = 1"
    ).bind(String(code).trim()).first();

    if (!org) {
      return NextResponse.json({ error: "That code wasn't recognized — check it with your therapist." }, { status: 404 });
    }

    // Same device fingerprint used for the redemption-count log below, reused
    // as a stable per-device id — so a code alone can still save schedules.
    // Previously this endpoint only set vs_org (branding/plan), never
    // vs_session (identity) — so nothing checking "who is this" (saving a
    // schedule, /api/auth/session, My Schedules) ever recognized a code-only
    // visitor as signed in, and nothing they built could be saved. This
    // gives them a real, storable identity, scoped to this org + device, so
    // the same code on the same device consistently returns to the same
    // saved schedules.
    const ua = request.headers.get("user-agent") || "";
    const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "";
    const raw = ua + "|" + ip;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) { hash = (hash * 31 + raw.charCodeAt(i)) | 0; }
    const deviceHash = String(hash >>> 0);
    const userId = `org-${org.id}-${deviceHash}`;

    // Log the redemption for the center's usage count
    try {
      await env.DB.prepare(
        "INSERT INTO org_redemptions (id, org_id, device_hash) VALUES (?, ?, ?)"
      ).bind(crypto.randomUUID(), org.id, deviceHash).run();
    } catch {}

    // Give this device a real user row so schedules can actually save
    // against it (same upsert pattern the OTP login uses).
    try {
      await env.DB.prepare(
        `INSERT OR IGNORE INTO users (id, email, role, created_at, updated_at)
         VALUES (?, ?, 'user', datetime('now'), datetime('now'))`
      ).bind(userId, `${userId}@code.local`).run();
    } catch {}

    const cookieStore = await cookies();
    cookieStore.set(ORG_COOKIE, Buffer.from(JSON.stringify({ orgId: org.id, redeemedAt: Date.now() })).toString("base64"), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
    cookieStore.set(SESSION_COOKIE, Buffer.from(JSON.stringify({
      userId, email: null, role: "user", viaCode: true, createdAt: Date.now(),
    })).toString("base64"), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return NextResponse.json({ ok: true, org: { name: org.name, logoUrl: org.logo_url } });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
