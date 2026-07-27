const FROM_EMAIL = "Visual Schedules <welcome@visualschedule.app>";

/**
 * Send email. Primary: Resend API (works for ANY recipient — needs
 * RESEND_API_KEY secret + visualschedule.app verified in Resend).
 * Fallback: Cloudflare Workers EMAIL binding (only delivers to addresses
 * verified in the Cloudflare account — fine for admin/dev, not for users).
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const env = (process as any).env;

  // 1) Resend — the real path for user-facing email
  if (env?.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to],
          subject,
          html,
          text: text || subject,
        }),
      });
      if (res.ok) {
        console.log("[Email] Sent via Resend");
        return true;
      }
      const errBody = await res.text();
      console.error("[Email] Resend failed:", res.status, errBody);
      // fall through to binding fallback
    } catch (err) {
      console.error("[Email] Resend error:", err);
    }
  }

  // 2) Cloudflare EMAIL binding fallback (verified destinations only)
  try {
    if (env?.EMAIL?.send) {
      const response = await env.EMAIL.send({
        to,
        from: "welcome@noreply.visualschedule.app",
        subject,
        html,
        text: text || subject,
      });
      console.log(`[Email] Sent via binding: ${response?.messageId || "ok"}`);
      return true;
    }
    console.log(`[Email] No provider available. Would send to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error("[Email] Send failed:", err);
    return false;
  }
}

export async function sendOTPEmail(email: string, code: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `${code} is your Visual Schedules sign-in code`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 420px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="font-family: Georgia, serif; font-style: italic; color: #1C1B19; font-size: 22px; margin-bottom: 16px;">Visual Schedules</h1>
        <p style="color: #5C5855; font-size: 14px; line-height: 1.7; margin-bottom: 8px;">
          Your sign-in code is:
        </p>
        <div style="background: #F8F7F4; border: 1px solid #DDD9D0; padding: 20px; text-align: center; margin-bottom: 20px;">
          <span style="font-size: 32px; letter-spacing: 8px; font-weight: 600; color: #1C1B19;">${code}</span>
        </div>
        <p style="color: #8A8480; font-size: 12px; line-height: 1.6;">
          This code expires in 15 minutes. If you didn't request this, ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #DDD9D0; margin: 24px 0;" />
        <p style="color: #8A8480; font-size: 12px; font-style: italic;">— Grow Gently</p>
      </div>
    `,
    text: `Your Visual Schedules code is: ${code}. It expires in 15 minutes.`,
  });
}
