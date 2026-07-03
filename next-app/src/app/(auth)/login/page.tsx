"use client";

import { useState } from "react";
import Link from "next/link";

type Step = "email" | "otp" | "done";
type Mode = "user" | "admin";

export default function LoginPage() {
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
        setStep("done");
        setTimeout(() => { window.location.href = "/schedule"; }, 800);
      } else {
        setError(data.error || "Invalid code");
      }
    } catch {
      setError("Verification failed. Please try again.");
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
        {/* Mobile-only slim banner */}
        <div className="md:hidden h-36 relative bg-[#FDF9F4] shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/login-hero.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-[18%_40%]"
            fetchPriority="high"
            decoding="async"
          />
        </div>

        <div className="px-6 pt-6 md:px-10 md:pt-8">
          <Link href="/schedule" className="font-serif text-xl md:text-2xl italic text-ink no-underline leading-none">
            Visual Schedules
          </Link>
        </div>

        <main className="flex-1 flex items-center justify-center px-6 py-10 md:px-10">
          <div className="w-full max-w-sm">

          {/* ── USER FLOW ── */}
          {mode === "user" && (
            <>
              {/* Step: email */}
              {step === "email" && (
                <>
                  <h1 className="font-serif text-xl italic text-ink mb-1.5">Sign in</h1>
                  <p className="text-[13px] text-ink-2 leading-relaxed mb-5">
                    Enter your email — we'll send a 6-digit code. No password needed.
                  </p>
                  <form onSubmit={handleSendOTP}>
                    <label className="text-[11px] tracking-widest uppercase text-[#8A8480] mb-1.5 block font-medium">
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
                    {error && <p className="text-xs text-[#C53030] mb-3">{error}</p>}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full text-[11px] tracking-wider uppercase py-3 bg-ink text-white border border-ink font-sans font-medium hover:bg-[#333] transition-all disabled:opacity-50"
                    >
                      {loading ? "Sending..." : "Send Code"}
                    </button>
                    {/* T&C inline — best practice, no extra screen */}
                    <p className="text-[11px] text-ink-3 text-center mt-3 leading-relaxed">
                      By continuing you agree to our{" "}
                      <Link href="/terms" className="text-ink underline">Terms</Link>
                      {" "}and{" "}
                      <Link href="/privacy" className="text-ink underline">Privacy Policy</Link>.
                    </p>
                  </form>
                  <div className="mt-4 pt-4 border-t border-border text-center">
                    <p className="text-[11px] text-ink-3">
                      No account needed for free cards.{" "}
                      <Link href="/schedule" className="text-ink underline">
                        Start creating →
                      </Link>
                    </p>
                  </div>
                </>
              )}

              {/* Step: OTP */}
              {step === "otp" && (
                <>
                  <h1 className="font-serif text-xl italic text-ink mb-1.5">Check your email</h1>
                  <p className="text-[13px] text-ink-2 leading-relaxed mb-5">
                    We sent a 6-digit code to{" "}
                    <strong className="text-ink">{email}</strong>. Enter it below.
                  </p>
                  <form onSubmit={handleVerifyOTP}>
                    <label className="text-[11px] tracking-widest uppercase text-[#8A8480] mb-1.5 block font-medium">
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
                      className="w-full text-[11px] tracking-wider uppercase py-3 bg-ink text-white border border-ink font-sans font-medium hover:bg-[#333] transition-all disabled:opacity-50"
                    >
                      {loading ? "Verifying..." : "Verify Code"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setStep("email"); setOtp(""); setError(""); }}
                      className="w-full text-[11px] text-ink-3 mt-2 py-2 hover:text-ink"
                    >
                      Use a different email
                    </button>
                  </form>
                </>
              )}

              {/* Step: done */}
              {step === "done" && (
                <div className="text-center py-4">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-badge-free-bg flex items-center justify-center">
                    <svg className="w-5 h-5 stroke-green stroke-2 fill-none" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-sm text-ink font-medium">Signed in!</p>
                  <p className="text-xs text-ink-2 mt-1">Taking you to the builder...</p>
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
                <label className="text-[11px] tracking-widest uppercase text-[#8A8480] mb-1.5 block font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-2.5 px-3 border border-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent mb-3"
                />
                <label className="text-[11px] tracking-widest uppercase text-[#8A8480] mb-1.5 block font-medium">Password</label>
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
                  className="w-full text-[11px] tracking-wider uppercase py-3 bg-accent text-white border border-accent font-sans font-medium hover:bg-accent-hover transition-all disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
              <button
                type="button"
                onClick={() => { setMode("user"); setError(""); setPassword(""); }}
                className="w-full text-[11px] text-ink-3 mt-3 py-2 hover:text-ink"
              >
                ← Back to sign in
              </button>
            </>
          )}
          </div>
        </main>

        {/* Quiet admin entry — user-centric by default */}
        <div className="px-6 pb-5 text-center shrink-0">
          {mode === "user" && step === "email" && (
            <button
              onClick={() => { setMode("admin"); setError(""); setEmail(""); }}
              className="text-[11px] text-ink-3 hover:text-ink underline underline-offset-2"
            >
              Login as admin
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
