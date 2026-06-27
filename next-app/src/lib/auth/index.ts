// Auth is now handled via custom endpoints:
// - POST /api/auth/login (admin email+password)
// - POST /api/auth/otp/send (user OTP)
// - POST /api/auth/otp/verify (user OTP verification)
// - GET /api/auth/session (get current session)
// - DELETE /api/auth/session (logout)

export const SESSION_COOKIE = "vs_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
