import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "vs_session";
const ORG_COOKIE = "vs_org";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Sign out. Cookies are set on the response object (not via the cookies()
// store), which is the only reliable way to guarantee Set-Cookie headers are
// emitted from a Route Handler on the Cloudflare/OpenNext runtime.
function expire(res: NextResponse) {
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
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return res;
}

// GET — a real browser navigation, then a redirect. Use this from a plain
// link. A fetch() response can have its Set-Cookie quietly ignored depending
// on how it's handled, which is why desktop sign-out appeared to do nothing;
// a navigation forces the browser to apply the headers.
export async function GET(request: NextRequest) {
  const url = new URL("/login?signedout=1", request.url);
  return expire(NextResponse.redirect(url, { status: 303 }));
}

// POST kept for any existing callers.
export async function POST() {
  return expire(NextResponse.json({ success: true }));
}
