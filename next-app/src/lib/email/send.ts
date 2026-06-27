const FROM_EMAIL = "welcome@noreply.visualschedule.app";

interface EmailBinding {
  send(msg: {
    to: string;
    from: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<{ messageId: string }>;
}

// Get the EMAIL binding from the Cloudflare env
// In Next.js on Cloudflare Workers, env is available via process.env at runtime
// but bindings need to be accessed via the request context
let _emailBinding: EmailBinding | null = null;

export function setEmailBinding(binding: EmailBinding) {
  _emailBinding = binding;
}

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
    // Try Workers EMAIL binding first
    if (_emailBinding) {
      const res = await _emailBinding.send({
        to,
        from: FROM_EMAIL,
        subject,
        html,
        text: text || subject,
      });
      console.log(`[Email] Sent via binding: ${res.messageId}`);
      return true;
    }

    // Fallback: Cloudflare Email Sending REST API
    const apiToken = process.env.CF_EMAIL_API_TOKEN || "";
    const accountId = process.env.CF_ACCOUNT_ID || "dc02bae6c57f5ac25d870cab7cdf2b0b";

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/email-sending/send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to,
          subject,
          html,
          text: text || subject,
        }),
      }
    );

    const data = await res.json();
    if (!data.success) {
      console.error("[Email] API response:", JSON.stringify(data));
    }
    return data.success === true;
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
