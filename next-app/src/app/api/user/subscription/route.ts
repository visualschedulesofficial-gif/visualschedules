import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "vs_session";

function getEnv(): { DB?: any } {
  const symbol = Symbol.for("__cloudflare-context__");
  const ctx = (globalThis as any)[symbol];
  return ctx?.env || {};
}

// GET /api/user/subscription — check if logged-in user has an active subscription
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE);

    if (!session?.value) {
      return NextResponse.json({ subscription: null });
    }

    const data = JSON.parse(Buffer.from(session.value, "base64").toString());
    const userId = data.userId;
    if (!userId) return NextResponse.json({ subscription: null });

    const env = getEnv();
    if (!env.DB) return NextResponse.json({ subscription: null });

    // Look for an active subscription that hasn't expired
    const row = await env.DB.prepare(
      `SELECT id, type, status, expires_at, created_at
       FROM subscriptions
       WHERE user_id = ?
         AND status = 'active'
         AND (expires_at IS NULL OR expires_at > datetime('now'))
       ORDER BY created_at DESC
       LIMIT 1`
    ).bind(userId).first();

    if (!row) return NextResponse.json({ subscription: null });

    return NextResponse.json({
      subscription: {
        type: row.type,         // "3mo" | "6mo" | "12mo"
        expiresAt: row.expires_at,
        status: row.status,
      },
    });
  } catch {
    return NextResponse.json({ subscription: null });
  }
}
