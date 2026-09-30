"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CardSetup } from "@/components/auth/CardSetup";
import { hasSavedPrefs } from "@/lib/prefs";

type Step = "email" | "otp" | "setup" | "done";
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
        afterSignIn();
      } else {
        setError(data.error || "Invalid code");
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function goIn() {
    window.location.href = next || (isMobile ? "/schedules" : "/schedule");
  }
  // First sign-in on this device: set up card language + character first.
  function afterSignIn() {
    if (hasSavedPrefs()) {
      setStep("done");
      setTimeout(goIn, 800);
    } else {
      setStep("setup");
    }
  }
  function finish() {
    afterSignIn();
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
        setup={<CardSetup onDone={() => { setStep("done"); setTimeout(goIn, 600); }} />}
      />
    );
  }

  const input = "w-full h-[50px] px-3.5 rounded-xl border border-input-border bg-white text-[16px] text-ink outline-none focus:border-accent-strong focus:ring-2 focus:ring-weekly-accent/30";
  const primary = "w-full min-h-[52px] rounded-[14px] bg-accent-strong text-white font-bold text-[15px] hover:bg-accent-hover disabled:opacity-50";
  const signedIn = step === "setup" || step === "done";

  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[1000px] grid md:grid-cols-[460px_1fr] bg-white rounded-3xl overflow-hidden shadow-[0_10px_40px_rgba(30,42,36,0.1)]">
          {/* Brand side */}
          <div className="bg-nav-bg text-white p-9 flex flex-col gap-3">
            <Link href="/schedule" className="flex items-center gap-2.5 no-underline text-white">
              <span className="w-9 h-9 rounded-[10px] bg-[#56663F] flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18M9 15l2 2 4-4" /></svg>
              </span>
              <span className="font-serif text-[17px]">Visual Schedules</span>
            </Link>
            <h2 className="font-serif font-normal text-[26px] leading-snug mt-6 mb-0">Picture schedules your child can follow.</h2>
            <p className="m-0 text-[#C9D6B8] text-[14px]">Free, in English, हिन्दी, मराठी and more. Built by a parent.</p>
            <div className="mt-auto pt-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/login-hero.jpg" alt="" className="w-full aspect-[4/3] object-cover object-left rounded-2xl" fetchPriority="high" decoding="async" />
            </div>
          </div>

          {/* Form side */}
          <div className="p-8 md:p-10 flex flex-col gap-5 max-h-[calc(100dvh-48px)] overflow-y-auto">
            {mode === "user" && (
              <ol className="m-0 p-0 list-none flex items-center gap-2.5 text-[13.5px] font-semibold" aria-label="Steps">
                <li className={`flex items-center gap-2 ${signedIn ? "text-accent-strong" : "text-ink"}`}>
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[12px] ${signedIn ? "bg-accent-soft border-accent-strong" : "bg-accent-strong border-accent-strong text-white"}`}>{signedIn ? "✓" : "1"}</span>
                  Sign in
                </li>
                <li aria-hidden className="w-9 h-0.5 rounded bg-[#DCE2D8]" />
                <li className={`flex items-center gap-2 ${signedIn ? "text-ink" : "text-ink-3"}`}>
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[12px] ${signedIn ? "bg-accent-strong border-accent-strong text-white" : "border-[#CBD3C6]"}`}>2</span>
                  Your cards
                </li>
              </ol>
            )}

            {mode === "user" && step === "email" && (
              <form onSubmit={handleSendOTP} className="flex flex-col gap-4 animate-[vsFadeIn_250ms_ease-out]">
                <div>
                  <h1 className="m-0 text-[26px] font-bold text-ink">Welcome</h1>
                  <p className="m-0 mt-1 text-[14px] text-ink-2">Enter your email and we&apos;ll send a 6-digit code. No password needed.</p>
                </div>
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink-2">
                  Email
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus autoComplete="email" className={input} />
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={hasAccessCode} onChange={(e) => setHasAccessCode(e.target.checked)} className="w-4 h-4 shrink-0 accent-[var(--accent-strong)]" />
                  <span className="text-[13px] text-ink-2">I have an access code (free subscription)</span>
                </label>
                {hasAccessCode && (
                  <div className="animate-[vsSlideDown_200ms_ease-out]">
                    <input type="text" value={orgCode} onChange={(e) => setOrgCode(e.target.value.toUpperCase())} placeholder="e.g. SUNSHINE24" aria-label="Access code" className={`${input} tracking-widest uppercase`} />
                    <p className="m-0 mt-1.5 text-[12px] text-ink-3">Unlocks all paid cards and adds your centre&apos;s branding.</p>
                  </div>
                )}
                {error && <p className="m-0 text-[13px] text-[#C53030]">{error}</p>}
                <button type="submit" disabled={loading} className={primary}>{loading ? "Sending…" : "Send me a code"}</button>
                <p className="m-0 text-[12.5px] text-ink-3 text-center">
                  By continuing you agree to our <Link href="/terms" className="text-ink-2 underline">Terms</Link> and <Link href="/privacy" className="text-ink-2 underline">Privacy policy</Link>.
                </p>
                <div className="pt-4 border-t border-border flex flex-col gap-2 items-center">
                  <span className="text-[13px] text-ink-3">No account needed for free cards</span>
                  <a href="/schedule" className="w-full min-h-[46px] rounded-xl border-[1.5px] border-input-border text-accent-strong font-semibold text-[14px] flex items-center justify-center no-underline hover:bg-surface-hover">
                    Create a free schedule →
                  </a>
                </div>
              </form>
            )}

            {mode === "user" && step === "otp" && (
              <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4 animate-[vsFadeIn_250ms_ease-out]">
                <div>
                  <h1 className="m-0 text-[26px] font-bold text-ink">Check your email</h1>
                  <p className="m-0 mt-1 text-[14px] text-ink-2">We sent a 6-digit code to <b className="text-ink">{email}</b>.</p>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••"
                  aria-label="6-digit code"
                  required
                  maxLength={6}
                  autoFocus
                  className="w-full h-[62px] rounded-xl border border-input-border text-center text-[28px] font-bold tracking-[14px] text-ink outline-none focus:border-accent-strong focus:ring-2 focus:ring-weekly-accent/30"
                />
                {error && <p className="m-0 text-[13px] text-[#C53030]">{error}</p>}
                <button type="submit" disabled={loading || otp.length < 6} className={primary}>{loading ? "Verifying…" : "Verify"}</button>
                <button type="button" onClick={() => { setStep("email"); setOtp(""); setError(""); }} className="text-[13px] font-semibold text-ink-3 hover:text-ink">
                  Use a different email
                </button>
              </form>
            )}

            {mode === "user" && step === "setup" && (
              <CardSetup onDone={() => { setStep("done"); setTimeout(goIn, 600); }} />
            )}

            {mode === "user" && step === "done" && (
              <div className="text-center py-10 animate-[vsFadeIn_250ms_ease-out]">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-accent-strong flex items-center justify-center animate-[vsPop_350ms_ease-out]">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <p className="m-0 font-bold text-[16px] text-ink">You&apos;re in!</p>
                <p className="m-0 mt-1 text-[13px] text-ink-2">Taking you to your schedules…</p>
              </div>
            )}

            {mode === "admin" && step === "email" && (
              <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
                <div>
                  <h1 className="m-0 text-[26px] font-bold text-ink">Admin sign in</h1>
                  <p className="m-0 mt-1 text-[14px] text-ink-2">For the Grow Gently team only.</p>
                </div>
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink-2">Email
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
                </label>
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink-2">Password
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
                </label>
                {error && <p className="m-0 text-[13px] text-[#C53030]">{error}</p>}
                <button type="submit" disabled={loading} className={primary}>{loading ? "Signing in…" : "Sign in"}</button>
                <button type="button" onClick={() => { setMode("user"); setError(""); setPassword(""); }} className="text-[13px] font-semibold text-ink-3 hover:text-ink">
                  ← Back to sign in
                </button>
              </form>
            )}

            {mode === "user" && step === "email" && (
              <button type="button" onClick={() => { setMode("admin"); setError(""); setEmail(""); }} className="mt-auto self-center text-[12px] text-ink-3 hover:text-ink underline underline-offset-2">
                Login as admin
              </button>
            )}
          </div>
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
  setup: React.ReactNode;
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

          {mode === "user" && step === "setup" && props.setup}

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
