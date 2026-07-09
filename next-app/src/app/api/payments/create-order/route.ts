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
const PLAN_MAP: Record<string, { amount: number; months: number; label: string }> = {
  "3mo": { amount: 39900, months: 3, label: "3 Months" },
  "6mo": { amount: 69900, months: 6, label: "6 Months" },
  "12mo": { amount: 119900, months: 12, label: "12 Months" },
};

// POST /api/payments/create-order — body: { plan: "3mo" | "6mo" | "12mo" }
export async function POST(request: NextRequest) {
  const env = getEnv();
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: "Payments not configured yet" }, { status: 503 });
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
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 502 });
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
