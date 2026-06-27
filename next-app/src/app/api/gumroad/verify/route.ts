import { NextRequest, NextResponse } from "next/server";

// POST /api/gumroad/verify — verify a license key
export async function POST(request: NextRequest) {
  try {
    const { licenseKey } = await request.json();
    if (!licenseKey) {
      return NextResponse.json({ error: "License key required" }, { status: 400 });
    }

    const productPermalink = process.env.GUMROAD_PRODUCT_PERMALINK;
    if (!productPermalink) {
      return NextResponse.json({ error: "Gumroad not configured" }, { status: 500 });
    }

    const res = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        product_permalink: productPermalink,
        license_key: licenseKey,
      }),
    });

    const data = await res.json();

    if (data.success) {
      // TODO: Store subscription in D1 for the authenticated user
      return NextResponse.json({
        valid: true,
        email: data.purchase?.email,
        productName: data.purchase?.product_name,
      });
    }

    return NextResponse.json({ valid: false, error: data.message || "Invalid key" }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
