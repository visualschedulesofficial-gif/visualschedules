import { NextRequest, NextResponse } from "next/server";

function getEnv(): any {
  const symbol = Symbol.for("__cloudflare-context__");
  const ctx = (globalThis as any)[symbol];
  return ctx?.env || {};
}

const PLAN_MONTHS: Record<string, number> = { "3mo": 3, "6mo": 6, "12mo": 12 };

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// POST /api/payments/verify
// body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
export async function POST(request: NextRequest) {
  const env = getEnv();
  if (!env.RAZORPAY_KEY_SECRET || !env.DB) {
    return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
  }

  const b = await request.json().catch(() => null);
  const orderId = b?.razorpay_order_id;
  const paymentId = b?.razorpay_payment_id;
  const signature = b?.razorpay_signature;
  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }

  // 1. Cryptographic proof the payment is genuine (Razorpay's signature)
  const expected = await hmacSha256Hex(env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`);
  if (expected !== signature) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  // 2. Read userId + plan from the ORDER's notes (server-trusted, not client input)
  const auth = "Basic " + Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    headers: { Authorization: auth },
  });
  if (!orderRes.ok) {
    return NextResponse.json({ error: "Could not confirm order" }, { status: 502 });
  }
  const order: any = await orderRes.json();
  const userId = order?.notes?.userId;
  const plan = order?.notes?.plan;
  const months = PLAN_MONTHS[plan];
  if (!userId || !months) {
    return NextResponse.json({ error: "Order details incomplete" }, { status: 400 });
  }

  // 3. Activate the subscription. The row id embeds the payment id, so a
  //    double-submit can never create a second subscription (idempotent).
  const subId = `rzp_${paymentId}`;
  await env.DB.prepare(
    `INSERT OR IGNORE INTO subscriptions (id, user_id, type, status, created_at, expires_at)
     VALUES (?, ?, ?, 'active', datetime('now'), datetime('now', '+' || ? || ' months'))`
  ).bind(subId, userId, plan, String(months)).run();

  return NextResponse.json({ ok: true, plan, months });
}
