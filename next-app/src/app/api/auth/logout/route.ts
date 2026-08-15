import { NextResponse } from "next/server";

const SESSION_COOKIE = "vs_session";
const ORG_COOKIE = "vs_org";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/auth/logout — sign out completely.
//
// Previous version mutated the cookies() store. That works in Server Actions
// but is unreliable inside Route Handlers on the Cloudflare/OpenNext runtime:
// the mutation isn't always attached to the outgoing response, so the browser
// never receives the Set-Cookie header and the session survives. That's the
// "login flashes for a split second, then I'm back in" behaviour.
//
// Setting the cookies on the NextResponse itself guarantees the Set-Cookie
// headers are sent. We also expire them three ways (empty value, maxAge 0 and
// an epoch expires) because Safari and Chrome disagree on which one alone is
// sufficient.
function buildLogoutResponse(body: unknown, status = 200) {
  const res = NextResponse.json(body, { status });
  for (const name of [SESSION_COOKIE, ORG_COOKIE]) {
    res.cookies.set({
      name,
      value: "",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  }
  // Belt and braces: an explicit delete after the expiry set.
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(ORG_COOKIE);
  // Never let a proxy or the browser serve this from cache.
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return res;
}

export async function POST() {
  return buildLogoutResponse({ success: true });
}

// GET works too, so a plain link can sign someone out if fetch is blocked.
export async function GET() {
  return buildLogoutResponse({ success: true });
}
