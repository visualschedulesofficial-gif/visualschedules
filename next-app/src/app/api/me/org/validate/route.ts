import { NextRequest, NextResponse } from "next/server";

function getEnv(): { DB?: any } {
  const symbol = Symbol.for("__cloudflare-context__");
  const ctx = (globalThis as any)[symbol];
  return ctx?.env || {};
}

export const dynamic = "force-dynamic";

// POST /api/me/org/validate — check an access code WITHOUT redeeming it.
//
// Deliberately sets no cookies. The login flow needs to verify a code
// before sending the email OTP, and redeeming (POST /api/me/org) creates a
// session — which would sign someone in on the strength of a code alone,
// before their email is verified. This just answers "is this code real?".
export async function POST(request: NextRequest) {
  try {
    const env = getEnv();
    const { code } = await request.json();
    if (!code || !env.DB) {
      return NextResponse.json({ ok: false, error: "Code required" }, { status: 400 });
    }

    const org = await env.DB.prepare(
      "SELECT name FROM orgs WHERE UPPER(access_code) = UPPER(?) AND active = 1"
    ).bind(String(code).trim()).first();

    if (!org) {
      return NextResponse.json(
        { ok: false, error: "That access code wasn't recognized — check it with your therapist." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { ok: true, org: { name: org.name } },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 });
  }
}
