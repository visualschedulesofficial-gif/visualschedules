import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "vs_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// POST /api/auth/otp/verify — verify OTP code, create session
export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check OTP from in-memory store (TODO: query D1 otp_codes table)
    const global = globalThis as any;
    const stored = global.__otpStore?.[normalizedEmail];

    if (!stored) {
      return NextResponse.json({ error: "No OTP found. Please request a new code." }, { status: 401 });
    }

    if (stored.code !== code.trim()) {
      return NextResponse.json({ error: "Invalid code" }, { status: 401 });
    }

    if (new Date(stored.expiresAt) < new Date()) {
      delete global.__otpStore[normalizedEmail];
      return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 401 });
    }

    // OTP valid — clear it
    delete global.__otpStore[normalizedEmail];

    // TODO: Upsert user in D1 (create on first login)
    const userId = `user-${normalizedEmail.replace(/[^a-z0-9]/g, "")}`;

    // Set session cookie
    const sessionData = JSON.stringify({
      userId,
      email: normalizedEmail,
      role: "user",
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
      user: { id: userId, email: normalizedEmail, role: "user" },
    });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
