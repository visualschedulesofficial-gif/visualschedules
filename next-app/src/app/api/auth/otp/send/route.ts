import { NextRequest, NextResponse } from "next/server";
import { sendOTPEmail } from "@/lib/email/send";

// POST /api/auth/otp/send — send 6-digit OTP to email
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

    // TODO: Store in D1 otp_codes table
    // For now, store in a simple in-memory map (works for single worker instance)
    // In production, this MUST be D1
    console.log(`[OTP] ${email} → ${code} (expires ${expiresAt})`);

    // Store OTP globally for verification (temporary until D1 wired)
    const global = globalThis as any;
    if (!global.__otpStore) global.__otpStore = {};
    global.__otpStore[email.toLowerCase()] = { code, expiresAt };

    // Send email
    const sent = await sendOTPEmail(email, code);
    if (!sent) {
      console.log(`[OTP] Email send failed for ${email}, code: ${code}`);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
