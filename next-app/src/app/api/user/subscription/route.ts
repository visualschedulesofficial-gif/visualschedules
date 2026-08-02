import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "vs_session";
const ORG_COOKIE = "vs_org";

function getEnv(): { DB?: any } {
  const symbol = Symbol.for("__cloudflare-context__");
  const ctx = (globalThis as any)[symbol];
  return ctx?.env || {};
}

// GET /api/user/subscription — is this visitor entitled to paid features?
// Three doors, checked in order:
//   1. A therapist access-code session (vs_org cookie) on an ACTIVE center
//      — no login needed at all.
//   2. A signed-in user with a real, unexpired subscription.
//   3. A signed-in user whose email is linked to an ACTIVE center.
// Flipping a center to Inactive in admin closes doors 1 and 3 instantly.
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const env = getEnv();

    // ---- Door 1: therapist code session (works without any login) ----
    if (env.DB) {
      const orgCookie = cookieStore.get(ORG_COOKIE);
      if (orgCookie?.value) {
        try {
          const { orgId } = JSON.parse(Buffer.from(orgCookie.value, "base64").toString());
          if (orgId) {
            const org = await env.DB.prepare(
              "SELECT name FROM orgs WHERE id = ? AND active = 1"
            ).bind(orgId).first();
            if (org) {
              return NextResponse.json({
                subscription: { type: "center", status: "active", expiresAt: null, center: org.name },
              });
            }
          }
        } catch {}
      }
    }

    const session = cookieStore.get(SESSION_COOKIE);
    if (!session?.value) {
      return NextResponse.json({ subscription: null });
    }
    const data = JSON.parse(Buffer.from(session.value, "base64").toString());
    const userId = data.userId;
    if (!userId) return NextResponse.json({ subscription: null });
    if (!env.DB) return NextResponse.json({ subscription: null });

    // ---- Door 2: a real paid (or comped) subscription ----
    const row = await env.DB.prepare(
      `SELECT id, type, status, expires_at, created_at
       FROM subscriptions
       WHERE user_id = ?
         AND status = 'active'
         AND (expires_at IS NULL OR expires_at > datetime('now'))
       ORDER BY created_at DESC
       LIMIT 1`
    ).bind(userId).first();

    if (row) {
      return NextResponse.json({
        subscription: {
          type: row.type,         // "3mo" | "6mo" | "12mo"
          expiresAt: row.expires_at,
          status: row.status,
        },
      });
    }

    // ---- Door 3: signed-in email linked to an active center ----
    try {
      const user = await env.DB.prepare("SELECT email FROM users WHERE id = ?")
        .bind(userId).first();
      if (user?.email) {
        const org = await env.DB.prepare(
          `SELECT o.name FROM org_members m
           JOIN orgs o ON o.id = m.org_id
           WHERE m.email = ? AND o.active = 1`
        ).bind((user.email as string).toLowerCase()).first();
        if (org) {
          return NextResponse.json({
            subscription: { type: "center", status: "active", expiresAt: null, center: org.name },
          });
        }
      }
    } catch {}

    return NextResponse.json({ subscription: null });
  } catch {
    return NextResponse.json({ subscription: null });
  }
}
