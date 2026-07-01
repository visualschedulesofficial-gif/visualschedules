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
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Simple nav */}
      <nav className="h-[56px] md:h-[66px] bg-surface border-b border-border flex items-center px-4 md:px-7 shrink-0">
        <Link href="/schedule" className="font-serif text-base md:text-2xl italic text-ink no-underline leading-none">
          Visual Schedules
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-surface w-full max-w-sm p-6 md:p-7 border border-border">

          {/* Mode tabs — only on email step */}
          {step === "email" && (
            <div className="flex gap-0 mb-5 border border-border">
              <button
                onClick={() => { setMode("user"); setError(""); }}
                className={`flex-1 py-2 text-[11px] tracking-wider uppercase font-medium font-sans transition-colors ${mode === "user" ? "bg-ink text-white" : "text-ink-3 hover:text-ink"}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode("admin"); setError(""); setEmail(""); }}
                className={`flex-1 py-2 text-[11px] tracking-wider uppercase font-medium font-sans transition-colors ${mode === "admin" ? "bg-ink text-white" : "text-ink-3 hover:text-ink"}`}
              >
                Admin
              </button>
            </div>
          )}

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
              <h1 className="font-serif text-xl italic text-ink mb-1.5">Admin</h1>
              <p className="text-[13px] text-ink-2 leading-relaxed mb-5">
                Sign in with admin credentials.
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
            </>
          )}
        </div>
      </main>
    </div>
  );
}
