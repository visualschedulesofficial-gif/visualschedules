const FROM_EMAIL = "welcome@noreply.visualschedule.app";

/**
 * Send email using the Cloudflare Workers EMAIL binding.
 * The binding is configured in wrangler.toml as [[send_email]] name = "EMAIL"
 * and accessed via process.env.EMAIL at runtime on Cloudflare Workers.
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
  try {
    const env = (process as any).env;

    if (env?.EMAIL?.send) {
      const response = await env.EMAIL.send({
        to,
        from: FROM_EMAIL,
        subject,
        html,
        text: text || subject,
      });
      console.log(`[Email] Sent via binding: ${response?.messageId || "ok"}`);
      return true;
    }

    // No binding available (local dev) — log to console
    console.log(`[Email] No EMAIL binding. Would send to ${to}: ${subject}`);
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
        <p style="color: #8A8480; font-size: 11px; font-style: italic;">— Grow Gently</p>
      </div>
    `,
    text: `Your Visual Schedules code is: ${code}. It expires in 15 minutes.`,
  });
}
