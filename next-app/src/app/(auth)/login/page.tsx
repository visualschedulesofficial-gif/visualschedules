"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Step = "email" | "otp" | "done";
type Mode = "user" | "admin";

const GREEN = "#4A5A3E";
const GREEN_DARK = "#3A4830";
const GREEN_SOFT = "#EAF1E2";
const GREEN_BORDER = "#C7D4B8";
const INK = "#1E2A24";
const SUB = "#6C7A72";
const BORDER = "#E6EBE6";
const BG = "#F5F8F5";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-bg" />}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const searchParams = useSearchParams();
  // ?next=/plans etc. — previously read nowhere, so /plans sending signed-out
  // users to /login?next=/plans always dropped them on the grid builder
  // instead of back where they meant to go. Fixed for both layouts below.
  const next = searchParams.get("next");

  const [isMobile, setIsMobile] = useState(false);
  const [checkedMobile, setCheckedMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => { setIsMobile(mq.matches); setCheckedMobile(true); };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const [loginMode, setLoginMode] = useState<"email" | "code">("email");
  const [orgCode, setOrgCode] = useState("");
  const [hasAccessCode, setHasAccessCode] = useState(false);
  const [orgMsg, setOrgMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [orgBusy, setOrgBusy] = useState(false);
  const redeemOrgCode = async () => {
    if (!orgCode.trim()) return;
    setOrgBusy(true);
    setOrgMsg(null);
    try {
      const res = await fetch("/api/me/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: orgCode.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setOrgMsg({ ok: true, text: `Welcome! You're connected to ${data.org.name}. Taking you in…` });
        setTimeout(() => { window.location.href = next || (isMobile ? "/schedules" : "/schedule"); }, 1200);
      } else {
        setOrgMsg({ ok: false, text: data.error || "That code wasn't recognized." });
      }
    } catch {
      setOrgMsg({ ok: false, text: "Couldn't check the code — try again." });
    }
    setOrgBusy(false);
  };
  const [mode, setMode] = useState<Mode>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      // Check the access code first — no point emailing a code if theirs is
      // wrong. Validate-only: it sets no cookies, so nobody gets signed in
      // on a code alone. It's actually redeemed after the email is verified.
      if (hasAccessCode) {
        if (!orgCode.trim()) {
          setError("Enter your access code, or untick the box.");
          setLoading(false);
          return;
        }
        const vRes = await fetch("/api/me/org/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: orgCode.trim() }),
        });
        const vData = await vRes.json();
        if (!vRes.ok || !vData.ok) {
          setError(vData.error || "That access code wasn't recognized.");
          setLoading(false);
          return;
        }
      }
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("otp");
      } else {
        setError(data.error || "Failed to send code");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Signed in. If they said they have an access code, ask for it on
        // its own step — never alongside the emailed code, which was
        // confusing (two different codes on one screen).
        if (hasAccessCode && orgCode.trim()) {
          // Already validated before the OTP was sent, so this should
          // succeed; if it somehow doesn't, they're still signed in and can
          // add it in Profile rather than losing the login.
          try {
            await fetch("/api/me/org", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: orgCode.trim() }),
            });
          } catch {}
        }
        setStep("done");
        setTimeout(() => { window.location.href = next || (isMobile ? "/schedules" : "/schedule"); }, 800);
      } else {
        setError(data.error || "Invalid code");
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function finish() {
    setStep("done");
    setTimeout(() => { window.location.href = next || (isMobile ? "/schedules" : "/schedule"); }, 800);
  }

  // Step 3 — access code. Already signed in by this point, so a bad code
  // never costs them the login; they can retry or skip.
  async function handleRedeemAccessCode(e: React.FormEvent) {
    e.preventDefault();
    if (!orgCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/me/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: orgCode.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.ok) { finish(); return; }
      setError(data.error || "That access code wasn't recognized.");
    } catch {
      setError("Couldn't check that code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = "/admin";
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("Login failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!checkedMobile) return <div className="min-h-dvh bg-bg" />;

  if (isMobile) {
    return (
      <MobileLogin
        mode={mode} setMode={setMode} loginMode={loginMode} setLoginMode={setLoginMode}
        step={step} setStep={setStep} email={email} setEmail={setEmail}
        password={password} setPassword={setPassword} otp={otp} setOtp={setOtp}
        orgCode={orgCode} setOrgCode={setOrgCode} orgMsg={orgMsg} orgBusy={orgBusy}
        hasAccessCode={hasAccessCode} setHasAccessCode={setHasAccessCode}
        redeemOrgCode={redeemOrgCode} loading={loading} error={error} setError={setError}
        onSendOTP={handleSendOTP} onVerifyOTP={handleVerifyOTP} onAdminLogin={handleAdminLogin}
        onRedeemAccessCode={handleRedeemAccessCode} onSkipAccessCode={finish}
      />
    );
  }

  return (
    <div className="min-h-dvh flex bg-surface">
      {/* Left: brand illustration (desktop) */}
      <div className="hidden md:block md:w-[55%] lg:w-[60%] relative bg-[#FDF9F4]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/login-hero.jpg"
          alt="What children can see, they can understand — Visual Schedules"
          className="absolute inset-0 w-full h-full object-cover object-left"
          fetchPriority="high"
          decoding="async"
        />
      </div>

      {/* Right: sign-in column */}
      <div className="flex-1 flex flex-col min-h-dvh">
        <div className="px-6 pt-4 md:px-10 md:pt-8">
          <Link href="/schedule" className="font-serif text-xl md:text-2xl italic text-ink no-underline leading-none">
            Visual Schedules
          </Link>
        </div>

        <main className="flex-1 min-h-0 overflow-y-auto flex md:items-center justify-center px-6 pt-4 pb-8 md:px-10 md:py-10">
          <div className="w-full max-w-sm">

          {/* ── USER FLOW ── */}
          {mode === "user" && (
            <>
              {step === "email" && (
                <>
                  <h1 className="font-serif text-xl italic text-ink mb-3">Sign in</h1>
                  <p className="text-[13px] text-ink-2 leading-relaxed mb-5">
                    Enter your email — we'll send a 6-digit code. No password needed.
                  </p>
                  <form onSubmit={handleSendOTP}>
                    <label className="text-[12px] tracking-widest uppercase text-[#5C5855] mb-1.5 block font-medium">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      autoFocus
                      className="w-full py-2.5 px-3 border border-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent mb-4"
                    />
                    <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasAccessCode}
                        onChange={(e) => setHasAccessCode(e.target.checked)}
                        className="w-4 h-4 shrink-0"
                        style={{ accentColor: "var(--accent-strong)" }}
                      />
                      <span className="text-[12px] text-ink-2">
                        I have an access code (free subscription)
                      </span>
                    </label>
                    {hasAccessCode && (
                      <div className="mb-4">
                        <input
                          type="text"
                          value={orgCode}
                          onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                          placeholder="e.g. SUNSHINE24"
                          className="w-full py-2.5 px-3 border border-input-border bg-surface-hover font-sans text-[15px] tracking-widest uppercase text-ink outline-none focus:border-accent"
                        />
                        <p className="text-[11px] text-ink-3 mt-1.5 leading-relaxed">
                          Unlocks all paid cards and adds your centre&apos;s branding.
                        </p>
                      </div>
                    )}
                    {error && <p className="text-xs text-[#C53030] mb-3">{error}</p>}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full text-[12px] tracking-wider uppercase py-3 bg-ink text-white border border-ink font-sans font-medium hover:bg-[#333] transition-all disabled:opacity-50"
                    >
                      {loading ? "Sending..." : "Send Code"}
                    </button>
                    <p className="text-[12px] text-ink-3 text-center mt-3 leading-relaxed">
                      By continuing you agree to our{" "}
                      <Link href="/terms" className="text-ink underline">Terms</Link>
                      {" "}and{" "}
                      <Link href="/privacy" className="text-ink underline">Privacy Policy</Link>.
                    </p>
                  </form>
                  <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-center text-[13px] text-ink-3 font-sans mb-2">No account needed for free cards</p>
            <a
              href="/schedule"
              className="block w-full text-center py-3 border border-[#7A8F5E] text-[#4A5A3E] rounded font-sans text-[14px] font-semibold no-underline hover:bg-[#7A8F5E] hover:text-white transition-all"
            >
              Create free schedule →
            </a>
                  </div>
                </>
              )}

              {step === "otp" && (
                <>
                  <h1 className="font-serif text-xl italic text-ink mb-1.5">Check your email</h1>
                  <p className="text-[13px] text-ink-2 leading-relaxed mb-5">
                    We sent a 6-digit code to{" "}
                    <strong className="text-ink">{email}</strong>. Enter it below.
                  </p>
                  <form onSubmit={handleVerifyOTP}>
                    <label className="text-[12px] tracking-widest uppercase text-[#5C5855] mb-1.5 block font-medium">
                      6-Digit Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      required
                      maxLength={6}
                      autoFocus
                      className="w-full py-3 px-3 border border-border bg-surface-hover font-sans text-[22px] text-ink text-center tracking-[8px] outline-none focus:border-accent mb-4 font-medium"
                    />

                    {error && <p className="text-xs text-[#C53030] mb-3">{error}</p>}
                    <button
                      type="submit"
                      disabled={loading || otp.length < 6}
                      className="w-full text-[12px] tracking-wider uppercase py-3 bg-ink text-white border border-ink font-sans font-medium hover:bg-[#333] transition-all disabled:opacity-50"
                    >
                      {loading ? "Verifying..." : "Verify Code"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setStep("email"); setOtp(""); setError(""); }}
                      className="w-full text-[12px] text-ink-3 mt-2 py-2 hover:text-ink"
                    >
                      Use a different email
                    </button>
                  </form>
                </>
              )}

              {step === "done" && (
                <div className="text-center py-4">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-badge-free-bg flex items-center justify-center">
                    <svg className="w-5 h-5 stroke-green stroke-2 fill-none" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-sm text-ink font-medium">Signed in!</p>
                  <p className="text-xs text-ink-2 mt-1">Taking you in...</p>
                </div>
              )}
            </>
          )}

          {/* ── ADMIN FLOW ── */}
          {mode === "admin" && step === "email" && (
            <>
              <h1 className="font-serif text-xl italic text-ink mb-1.5">Admin sign in</h1>
              <p className="text-[13px] text-ink-2 leading-relaxed mb-5">
                For Grow Gently team only.
              </p>
              <form onSubmit={handleAdminLogin}>
                <label className="text-[12px] tracking-widest uppercase text-[#5C5855] mb-1.5 block font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-2.5 px-3 border border-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent mb-3"
                />
                <label className="text-[12px] tracking-widest uppercase text-[#5C5855] mb-1.5 block font-medium">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-2.5 px-3 border border-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent mb-4"
                />
                {error && <p className="text-xs text-[#C53030] mb-3">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-[12px] tracking-wider uppercase py-3 bg-accent text-white border border-accent font-sans font-medium hover:bg-accent-hover transition-all disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
              <button
                type="button"
                onClick={() => { setMode("user"); setError(""); setPassword(""); }}
                className="w-full text-[12px] text-ink-3 mt-3 py-2 hover:text-ink"
              >
                ← Back to sign in
              </button>
            </>
          )}
          </div>
        </main>

        <div className="px-6 pb-5 text-center shrink-0">
          {mode === "user" && step === "email" && (
            <button
              onClick={() => { setMode("admin"); setError(""); setEmail(""); }}
              className="text-[12px] text-ink-3 hover:text-ink underline underline-offset-2"
            >
              Login as admin
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== *
 * MOBILE LOGIN — green identity, no brown/cream, no serif wordmark.
 * Same auth logic and endpoints as desktop (OTP send/verify, org code,
 * admin login) — only the shell differs.
 * ================================================================== */
function MobileLogin(props: {
  mode: Mode; setMode: (m: Mode) => void;
  loginMode: "email" | "code"; setLoginMode: (m: "email" | "code") => void;
  step: Step; setStep: (s: Step) => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  otp: string; setOtp: (v: string) => void;
  orgCode: string; setOrgCode: (v: string) => void;
  hasAccessCode: boolean; setHasAccessCode: (v: boolean) => void;
  orgMsg: { ok: boolean; text: string } | null; orgBusy: boolean; redeemOrgCode: () => void;
  loading: boolean; error: string; setError: (v: string) => void;
  onSendOTP: (e: React.FormEvent) => void; onVerifyOTP: (e: React.FormEvent) => void; onAdminLogin: (e: React.FormEvent) => void;
  onRedeemAccessCode: (e: React.FormEvent) => void; onSkipAccessCode: () => void;
}) {
  const {
    mode, setMode, loginMode, setLoginMode, step, setStep, email, setEmail,
    password, setPassword, otp, setOtp, orgCode, setOrgCode, orgMsg, orgBusy,
    redeemOrgCode, loading, error, setError, onSendOTP, onVerifyOTP, onAdminLogin,
    hasAccessCode, setHasAccessCode, onRedeemAccessCode, onSkipAccessCode,
  } = props;

  const inputStyle = { border: `1.5px solid ${GREEN_BORDER}`, color: INK };

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: BG }}>
      <div className="flex-1 overflow-y-auto flex flex-col justify-center px-6 py-10">
        <div className="w-full max-w-sm mx-auto">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center" style={{ background: GREEN_SOFT }}>
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <h1 className="font-bold text-[20px]" style={{ color: INK }}>Visual Schedule</h1>
          </div>

          {mode === "user" && step === "email" && (
            <>
              <form onSubmit={onSendOTP}>
                <p className="text-[13px] mb-4" style={{ color: SUB }}>We'll email you a one-time code — no password needed.</p>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required autoFocus
                  className="w-full px-4 py-3 rounded-xl text-[15px] outline-none mb-4" style={inputStyle} />
                <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasAccessCode}
                    onChange={(e) => setHasAccessCode(e.target.checked)}
                    className="w-4 h-4 shrink-0"
                    style={{ accentColor: GREEN }}
                  />
                  <span className="text-[12px]" style={{ color: SUB }}>
                    I have an access code (free subscription)
                  </span>
                </label>
                  {hasAccessCode && (
                    <div className="mb-4">
                      <input
                        value={orgCode}
                        onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                        placeholder="e.g. SUNSHINE24"
                        className="w-full px-4 py-3 rounded-xl text-[15px] tracking-widest outline-none"
                        style={inputStyle}
                      />
                      <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: SUB }}>
                        Unlocks all paid cards and adds your centre&apos;s branding.
                      </p>
                    </div>
                  )}
                {error && <p className="text-[12px] mb-3" style={{ color: "#DC4C4C" }}>{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white disabled:opacity-60"
                  style={{ background: GREEN, boxShadow: "0 6px 16px rgba(74,90,62,0.28)" }}>
                  {loading ? "Sending…" : "Send code"}
                </button>
                <p className="text-[11px] text-center mt-3 leading-relaxed" style={{ color: "#9AA69E" }}>
                  By continuing you agree to our{" "}
                  <Link href="/terms" style={{ color: SUB }} className="underline">Terms</Link>{" "}and{" "}
                  <Link href="/privacy" style={{ color: SUB }} className="underline">Privacy Policy</Link>.
                </p>
              </form>

              {/* Code sign-in is desktop-only on purpose — the tab is gone
                  from mobile, so this note tells anyone holding a centre
                  code where to use it instead of leaving them stuck. */}
              <div className="mt-5 p-3 rounded-2xl text-center" style={{ background: GREEN_SOFT, border: `1px solid ${GREEN_BORDER}` }}>
                <p className="text-[12px] leading-relaxed" style={{ color: GREEN_DARK }}>
                  Access codes come from your therapy centre and unlock all paid cards.
                </p>
              </div>
            </>
          )}

          {mode === "user" && step === "otp" && (
            <form onSubmit={onVerifyOTP}>
              <p className="text-[13px] mb-4 text-center" style={{ color: SUB }}>
                Code sent to <b style={{ color: INK }}>{email}</b>. Enter it below.
              </p>
              <input type="text" inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456" required maxLength={6} autoFocus
                className="w-full py-3 px-3 rounded-xl text-[22px] text-center tracking-[8px] font-bold outline-none mb-4" style={inputStyle} />

              {error && <p className="text-[12px] mb-3 text-center" style={{ color: "#DC4C4C" }}>{error}</p>}
              <button type="submit" disabled={loading || otp.length < 6}
                className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white disabled:opacity-60"
                style={{ background: GREEN, boxShadow: "0 6px 16px rgba(74,90,62,0.28)" }}>
                {loading ? "Verifying…" : "Verify Code"}
              </button>
              <button type="button" onClick={() => { setStep("email"); setOtp(""); setError(""); }}
                className="w-full text-[13px] font-semibold mt-3 py-2" style={{ color: SUB }}>
                Use a different email
              </button>
            </form>
          )}

          {mode === "user" && step === "done" && (
            <div className="text-center py-4">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: GREEN }}>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <p className="font-bold text-[15px]" style={{ color: INK }}>Signed in!</p>
              <p className="text-[13px] mt-1" style={{ color: SUB }}>Taking you in…</p>
            </div>
          )}

          {mode === "admin" && step === "email" && (
            <form onSubmit={onAdminLogin}>
              <p className="text-[13px] mb-4 text-center" style={{ color: SUB }}>For Grow Gently team only.</p>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
                className="w-full px-4 py-3 rounded-xl text-[15px] outline-none mb-3" style={inputStyle} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
                className="w-full px-4 py-3 rounded-xl text-[15px] outline-none mb-4" style={inputStyle} />
              {error && <p className="text-[12px] mb-3 text-center" style={{ color: "#DC4C4C" }}>{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white disabled:opacity-60"
                style={{ background: GREEN }}>
                {loading ? "Signing in…" : "Sign In"}
              </button>
              <button type="button" onClick={() => { setMode("user"); setError(""); setPassword(""); }}
                className="w-full text-[13px] font-semibold mt-3 py-2" style={{ color: SUB }}>
                ← Back to sign in
              </button>
            </form>
          )}

          {mode === "user" && step === "email" && (
            <>
              <button onClick={() => { setMode("admin"); setError(""); setEmail(""); }}
                className="w-full text-center text-[12px] mt-6 underline underline-offset-2" style={{ color: "#9AA69E" }}>
                Login as admin
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/art/login-art.svg" alt="" className="w-full max-w-[240px] mx-auto mt-6 opacity-80" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
