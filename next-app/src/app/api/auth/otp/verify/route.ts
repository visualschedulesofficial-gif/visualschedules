import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1 } from "@/types/cloudflare";

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

    const { env } = getCloudflareContext() as unknown as { env: { DB?: D1 } };
    if (!env?.DB) {
      return NextResponse.json({ error: "Verification unavailable" }, { status: 500 });
    }

    const stored = await env.DB.prepare(
      `SELECT code, expires_at FROM otp_codes WHERE email = ?`
    )
      .bind(normalizedEmail)
      .first<{ code: string; expires_at: string }>();

    if (!stored) {
      return NextResponse.json({ error: "No OTP found. Please request a new code." }, { status: 401 });
    }

    if (stored.code !== code.trim()) {
      return NextResponse.json({ error: "Invalid code" }, { status: 401 });
    }

    if (new Date(stored.expires_at) < new Date()) {
      await env.DB.prepare(`DELETE FROM otp_codes WHERE email = ?`).bind(normalizedEmail).run();
      return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 401 });
    }

    // OTP valid — clear it so it can't be reused
    await env.DB.prepare(`DELETE FROM otp_codes WHERE email = ?`).bind(normalizedEmail).run();

    // Create the account row on first login.
    //
    // This was left as a TODO: a session cookie was issued but no user row was
    // ever written. The app therefore *looked* signed in while the database
    // had no record of the person — so checkout failed with "please sign in
    // first", subscriptions had nothing to attach to, and paid access could
    // never be granted. Everything downstream depends on this row existing.
    const userId = `user-${normalizedEmail.replace(/[^a-z0-9]/g, "")}`;

    // Preserve an existing role (e.g. admin) — only insert when absent.
    await env.DB.prepare(
      `INSERT OR IGNORE INTO users (id, email, role, created_at, updated_at)
       VALUES (?, ?, 'user', datetime('now'), datetime('now'))`
    ).bind(userId, normalizedEmail).run();

    // Keep the stored email current in case it changed casing.
    await env.DB.prepare(
      `UPDATE users SET email = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(normalizedEmail, userId).run();

    // Carry the real role into the session so admins stay admins.
    const existing: any = await env.DB.prepare(`SELECT role FROM users WHERE id = ?`)
      .bind(userId)
      .first();
    const role = (existing?.role as string) || "user";

    // Set session cookie
    const sessionData = JSON.stringify({
      userId,
      email: normalizedEmail,
      role,
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
