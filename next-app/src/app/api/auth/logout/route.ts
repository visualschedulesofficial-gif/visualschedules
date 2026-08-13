import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "vs_session";

// POST /api/auth/logout — clears the session cookie. Nothing called this
// before; the Profile tab on the mobile home needs a real sign-out action.
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return NextResponse.json({ success: true });
}
