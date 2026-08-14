import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "vs_session";
const ORG_COOKIE = "vs_org";

// POST /api/auth/logout — sign out completely.
//
// Two fixes over the previous version:
//  1. It only cleared vs_session and left vs_org behind, so after "signing
//     out" the centre branding banner and paid-card access were still
//     active — which reads as "logout didn't work".
//  2. maxAge: 0 alone isn't reliably honoured everywhere (Safari in
//     particular); pairing it with an epoch `expires` is the dependable
//     way to delete a cookie.
function clear(cookieStore: Awaited<ReturnType<typeof cookies>>, name: string) {
  cookieStore.set(name, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
    expires: new Date(0),
    path: "/",
  });
}

export async function POST() {
  const cookieStore = await cookies();
  clear(cookieStore, SESSION_COOKIE);
  clear(cookieStore, ORG_COOKIE);
  return NextResponse.json({ success: true });
}

// Allow GET too, so a plain link can sign someone out if a fetch is blocked.
export async function GET() {
  const cookieStore = await cookies();
  clear(cookieStore, SESSION_COOKIE);
  clear(cookieStore, ORG_COOKIE);
  return NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "https://visualschedule.app")
  );
}
