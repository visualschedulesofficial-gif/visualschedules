import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_EMAIL = "admin@dataorc.in";
const ADMIN_PASSWORD = "admin123$";
const SESSION_COOKIE = "vs_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// POST /api/auth/login — email+password login (admin)
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = generateSessionToken();

    // TODO: Store session in D1 for production
    // For now, session is the token itself containing user info
    const sessionData = JSON.stringify({
      userId: "admin-001",
      email: ADMIN_EMAIL,
      role: "admin",
      createdAt: Date.now(),
    });
    const encodedSession = Buffer.from(sessionData).toString("base64");

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, encodedSession, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: { email: ADMIN_EMAIL, role: "admin", name: "Admin" },
    });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
