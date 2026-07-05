import { cookies } from "next/headers";

const SESSION_COOKIE = "vs_session";

export function getEnv(): { DB?: any; R2?: any; R2_BUCKET?: any } {
  const symbol = Symbol.for("__cloudflare-context__");
  const ctx = (globalThis as any)[symbol];
  return ctx?.env || {};
}

export async function requireAdmin(env: any): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE);
    if (!session?.value || !env.DB) return false;
    const data = JSON.parse(Buffer.from(session.value, "base64").toString());
    if (!data.userId) return false;
    const user = await env.DB.prepare("SELECT role FROM users WHERE id = ?")
      .bind(data.userId)
      .first();
    return user?.role === "admin";
  } catch {
    return false;
  }
}
