import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "vs_session";

// Never cache who is signed in. Without these, the browser can serve a
// stale "logged in" response after logout — the Sign In screen flashes,
// then the cached session re-marks the person as signed in.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
} as const;

// GET /api/auth/session — who is signed in right now, if anyone.
//
// This file had been overwritten with the /api/user/subscription logic
// (same file content, wrong route) — so every page that called
// /api/auth/session expecting { user } was actually getting
// { subscription } back, and silently treating everyone as signed out.
// /schedules (desktop) reads this to decide whether to show "Sign In" or
// the real schedule list; the new mobile home does the same. Restored to
// its real job: decode the vs_session cookie (already set by
// /api/auth/otp/verify with { userId, email, role }) and return the user.
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE);
    if (!session?.value) {
      return NextResponse.json({ user: null }, { headers: NO_STORE });
    }

    const data = JSON.parse(Buffer.from(session.value, "base64").toString());
    if (Date.now() - data.createdAt > 30 * 24 * 60 * 60 * 1000) {
      return NextResponse.json({ user: null }, { headers: NO_STORE });
    }
    if (!data.userId) {
      return NextResponse.json({ user: null }, { headers: NO_STORE });
    }

    return NextResponse.json(
      { user: { id: data.userId, email: data.email || null, role: data.role || "user" } },
      { headers: NO_STORE }
    );
  } catch {
    return NextResponse.json({ user: null }, { headers: NO_STORE });
  }
}
