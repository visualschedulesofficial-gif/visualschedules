import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "vs_session";

function getEnv(): any {
  const symbol = Symbol.for("__cloudflare-context__");
  const ctx = (globalThis as any)[symbol];
  return ctx?.env || {};
}

async function getUserId(env: any): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE);
    if (!session?.value || !env.DB) return null;
    const data = JSON.parse(Buffer.from(session.value, "base64").toString());
    if (!data.userId) return null;
    const user = await env.DB.prepare("SELECT id FROM users WHERE id = ?").bind(data.userId).first();
    return user?.id || null;
  } catch {
    return null;
  }
}

// Amounts live SERVER-SIDE only — the client can never choose its own price.
// Amounts are in paise (₹99 = 9900). These MUST match the prices shown on
// /plans — the server is the source of truth for what gets charged.
const PLAN_MAP: Record<string, { amount: number; months: number; label: string }> = {
  "1mo": { amount: 9900, months: 1, label: "1 Month" },
  "6mo": { amount: 44900, months: 6, label: "6 Months" },
  "12mo": { amount: 79900, months: 12, label: "1 Year" },
  // Old id kept so any checkout already in flight doesn't break. Priced at
  // the new 6-month rate.
  "3mo": { amount: 44900, months: 6, label: "6 Months" },
};

// POST /api/payments/create-order — body: { plan: "1mo" | "6mo" | "12mo" }
export async function POST(request: NextRequest) {
  const env = getEnv();
  const missing: string[] = [];
  if (!env.RAZORPAY_KEY_ID) missing.push("RAZORPAY_KEY_ID");
  if (!env.RAZORPAY_KEY_SECRET) missing.push("RAZORPAY_KEY_SECRET");
  if (missing.length) {
    return NextResponse.json(
      { error: `Payments not configured — missing on server: ${missing.join(", ")}` },
      { status: 503 }
    );
  }

  const userId = await getUserId(env);
  if (!userId) return NextResponse.json({ error: "Please sign in first" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const plan = PLAN_MAP[body?.plan];
  if (!plan) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

  const auth = "Basic " + Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify({
      amount: plan.amount,
      currency: "INR",
      receipt: `vs_${Date.now()}`,
      notes: { userId, plan: body.plan },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[create-order] Razorpay rejected the order:", res.status, detail);
    return NextResponse.json(
      { error: `Razorpay rejected the request (HTTP ${res.status}): ${detail.slice(0, 300)}` },
      { status: 502 }
    );
  }
  const order: any = await res.json();

  return NextResponse.json({
    orderId: order.id,
    amount: plan.amount,
    currency: "INR",
    keyId: env.RAZORPAY_KEY_ID,
    planLabel: plan.label,
  });
}
