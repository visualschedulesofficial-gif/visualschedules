import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sendOTPEmail } from "@/lib/email/send";
import type { D1 } from "@/types/cloudflare";

// POST /api/auth/otp/send — send 6-digit OTP to email
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

    const { env } = getCloudflareContext() as unknown as { env: { DB?: D1 } };
    if (!env?.DB) {
      // Local dev without D1 — log the code so signup can still be tested
      console.log(`[OTP] No DB binding. ${normalizedEmail} → ${code}`);
      return NextResponse.json({ success: true });
    }

    await env.DB.prepare(
      `INSERT INTO otp_codes (email, code, expires_at) VALUES (?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET code = excluded.code, expires_at = excluded.expires_at`
    )
      .bind(normalizedEmail, code, expiresAt)
      .run();

    const sent = await sendOTPEmail(normalizedEmail, code);
    if (!sent) {
      return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
