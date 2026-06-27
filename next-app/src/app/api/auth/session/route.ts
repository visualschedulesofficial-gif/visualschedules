import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "vs_session";

// GET /api/auth/session — get current session
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);

  if (!session?.value) {
    return NextResponse.json({ user: null });
  }

  try {
    const data = JSON.parse(Buffer.from(session.value, "base64").toString());

    // Check if session is expired (30 days)
    if (Date.now() - data.createdAt > 30 * 24 * 60 * 60 * 1000) {
      cookieStore.delete(SESSION_COOKIE);
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: data.userId,
        email: data.email,
        role: data.role,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}

// DELETE /api/auth/session — logout
export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ success: true });
}
