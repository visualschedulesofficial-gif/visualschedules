"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface User {
  id: string;
  email: string | null;
  role: string;
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Try the app with no commitment",
    features: [
      "Daily category cards",
      "All 4 schedule types",
      "Export PDF & JPEG",
      "English + Hindi",
      "No login required",
    ],
    locked: [
      "School, Therapy, Meals categories",
      "Social, Art, Home categories",
    ],
    cta: "Start Creating",
    ctaHref: "/schedule",
    highlight: false,
    isFree: true,
  },
  {
    id: "1mo",
    name: "1 Month",
    price: "₹99",
    period: "1 month",
    perMonth: "₹99/month",
    description: "Try everything, no commitment",
    features: [
      "Everything in Free",
      "All paid categories unlocked",
      "School, Therapy, Meals",
      "Social, Art, Home",
      "Any new categories added",
    ],
    cta: "Subscribe — ₹99",
    highlight: false,
    isFree: false,
  },
  {
    id: "6mo",
    name: "6 Months",
    price: "₹449",
    period: "6 months",
    perMonth: "₹75/month",
    description: "Settle into a rhythm",
    features: [
      "Everything in Free",
      "All paid categories unlocked",
      "School, Therapy, Meals",
      "Social, Art, Home",
      "Any new categories added",
    ],
    cta: "Subscribe — ₹449",
    highlight: true, // Most popular
    isFree: false,
  },
  {
    id: "12mo",
    name: "1 Year",
    price: "₹799",
    period: "12 months",
    perMonth: "₹67/month",
    badge: "Best Value",
    description: "A full year of calmer days",
    features: [
      "Everything in Free",
      "All paid categories unlocked",
      "School, Therapy, Meals",
      "Social, Art, Home",
      "Any new categories added",
    ],
    cta: "Subscribe — ₹799",
    highlight: false,
    isFree: false,
  },
];

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PlansPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [payMessage, setPayMessage] = useState("");
  const [showPartner, setShowPartner] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadOrg, setLeadOrg] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadNote, setLeadNote] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [checkedMobile, setCheckedMobile] = useState(false);
  const [gateChecked, setGateChecked] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => { setIsMobile(mq.matches); setCheckedMobile(true); };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!checkedMobile) return;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const u = data.user || null;
        setUser(u);
        // Mobile only: desktop keeps letting people browse plans without an
        // account (matches its existing "no account needed for free cards"
        // flow). On mobile, always require sign-in first, same as Create.
        if (isMobile && !u) {
          router.push("/login?next=/plans");
          return;
        }
        setGateChecked(true);
      })
      .catch(() => setGateChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedMobile]);

  async function handleSubscribeClick(planId: string) {
    if (!user) {
      window.location.href = `/login?next=/plans`;
      return;
    }
    if (planId === "free") {
      window.location.href = "/schedule";
      return;
    }
    setPaying(planId);
    setPayMessage("");
    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) throw new Error("network");

      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const order = await res.json();
      if (!res.ok) {
        // Show the actual reason rather than a generic failure — this is what
        // tells us whether it's keys, plan id, or something else.
        throw new Error(order?.error || `Could not start checkout (HTTP ${res.status})`);
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Visual Schedules",
        description: `${order.planLabel} plan`,
        // Send the email as both the prefill AND a note on the order, so the
        // payment is identifiable in the Razorpay dashboard by the same
        // address the app knows them by. Previously only `email` was sent and
        // Razorpay still asked for a phone number, which became the identity
        // on Razorpay's side — hence records that didn't match the app's.
        prefill: {
          email: user.email || "",
          name: user.email ? user.email.split("@")[0] : "",
        },
        notes: { app_email: user.email || "", app_user_id: user.id },
        readonly: { email: true },
        theme: { color: "#4A5A3E" },
        handler: async (response: any) => {
          // Payment done — verify on the server, then unlock
          const v = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const result = await v.json();
          if (v.ok && result.ok) {
            setPayMessage("✓ Payment successful! Your plan is active. Taking you to the builder…");
            setTimeout(() => {
              window.location.href = "/schedule";
            }, 1800);
          } else {
            setPayMessage(
              "Payment received but confirmation hit a snag — don't worry, your money is safe. Refresh in a minute or email us and we'll sort it immediately."
            );
          }
          setPaying(null);
        },
        modal: {
          ondismiss: () => setPaying(null),
        },
      });
      rzp.on("payment.failed", () => {
        setPayMessage("Payment didn't go through — nothing was charged. You can try again.");
        setPaying(null);
      });
      rzp.open();
    } catch (err: any) {
      // Show the real message. A silent generic error is why this was hard to
      // diagnose before — now the screen says exactly what Razorpay or the
      // server objected to.
      const detail = err?.message ? ` (${err.message})` : "";
      setPayMessage(`Could not start the payment${detail}. Please try again, or email us and we'll sort it.`);
      setPaying(null);
    }
  }

  if (checkedMobile && isMobile && !gateChecked) {
    return <div className="h-dvh bg-bg" />;
  }

  return (
    <div className="h-dvh bg-bg flex flex-col overflow-hidden">
      {/* Nav */}
      <nav className="h-[56px] md:h-[66px] bg-surface border-b border-border flex items-center justify-between px-4 md:px-7 shrink-0">
        <Link href="/schedule" className="font-serif text-base md:text-2xl italic text-ink no-underline leading-none">
          Visual Schedules
        </Link>
        {!user ? (
          <Link
            href="/login"
            className="text-[12px] tracking-wider uppercase px-4 py-[0.42rem] border border-border text-[#4A4540] no-underline font-medium font-sans hover:border-ink hover:text-ink transition-all"
          >
            Sign In
          </Link>
        ) : (
          <Link
            href="/schedules"
            className="text-[12px] tracking-wider uppercase px-4 py-[0.42rem] border border-border text-[#4A4540] no-underline font-medium font-sans hover:border-ink hover:text-ink transition-all"
          >
            My Schedules
          </Link>
        )}
      </nav>

      <main className="flex-1 min-h-0 overflow-y-auto px-4 py-12 w-full"><div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl italic text-ink mb-3">
            Simple, honest pricing
          </h1>
          <p className="text-[14px] text-ink-2 max-w-md mx-auto leading-relaxed">
            The daily category is always free. Subscribe to unlock every category — no auto-renewal, ever.
          </p>
        </div>

        {payMessage && (
          <div className="max-w-[560px] mx-auto mb-6 px-4 py-3 rounded bg-[#E8EDE0] text-[#4A5A3E] text-[14px] text-center font-sans">
            {payMessage}
          </div>
        )}

        {/* Plans grid */}
        <div id="compare" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`bg-surface border flex flex-col relative ${
                plan.highlight
                  ? "border-accent shadow-md"
                  : "border-border"
              }`}
            >
              {/* Most popular / best value badge */}
              {plan.highlight && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <span className="text-[12px] tracking-wider uppercase font-semibold bg-accent text-white px-3 py-1">
                    Most Popular
                  </span>
                </div>
              )}
              {plan.badge && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <span className="text-[12px] tracking-wider uppercase font-semibold bg-[#A8824A] text-white px-3 py-1">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="p-5 flex flex-col flex-1">
                {/* Plan name + price */}
                <div className="mb-4 pb-4 border-b border-border">
                  <h2 className="text-[12px] tracking-wider uppercase font-semibold text-ink-3 mb-2">
                    {plan.name}
                  </h2>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif text-3xl italic text-ink">{plan.price}</span>
                    <span className="text-[12px] text-ink-3">/ {plan.period}</span>
                  </div>
                  {plan.perMonth && (
                    <p className="text-[12px] text-ink-3 mt-1">{plan.perMonth}</p>
                  )}
                  <p className="text-[12px] text-ink-2 mt-2">{plan.description}</p>
                </div>

                {/* Features */}
                <ul className="space-y-2 flex-1 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[12px] text-ink-2">
                      <svg className="w-3.5 h-3.5 stroke-green stroke-2 fill-none shrink-0 mt-0.5" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                  {plan.locked?.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[12px] text-ink-3 opacity-60">
                      <svg className="w-3.5 h-3.5 stroke-ink-3 stroke-2 fill-none shrink-0 mt-0.5" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {plan.isFree ? (
                  <Link
                    href="/schedule"
                    className="w-full text-center text-[12px] tracking-wider uppercase py-2.5 border border-border text-[#4A4540] no-underline font-medium font-sans hover:border-ink hover:text-ink transition-all block"
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <button
                    onClick={() => handleSubscribeClick(plan.id)}
                    disabled={paying === plan.id}
                    className={`w-full text-center text-[12px] tracking-wider uppercase py-2.5 font-medium font-sans transition-all ${
                      plan.highlight
                        ? "bg-accent text-white border border-accent hover:bg-accent-hover"
                        : "bg-ink text-white border border-ink hover:bg-[#333]"
                    }`}
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Schools & therapy centres — a lead form, not a checkout. These are
            negotiated deals, so it collects contact details and opens an email
            rather than pretending there's a fixed price. */}
        <div className="max-w-lg mx-auto mb-8">
          <button
            onClick={() => setShowPartner((v) => !v)}
            className="w-full flex items-center justify-between gap-3 bg-surface border border-border px-5 py-4 text-left hover:border-ink transition-all"
          >
            <span>
              <span className="block text-[14px] font-medium text-ink">Working with a school or centre?</span>
              <span className="block text-[12px] text-ink-2 mt-0.5">Special pricing for schools, therapy centres and therapists</span>
            </span>
            <svg
              className={`w-4 h-4 stroke-ink-2 stroke-[1.8] fill-none shrink-0 transition-transform ${showPartner ? "rotate-180" : ""}`}
              viewBox="0 0 24 24"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showPartner && (
            <div className="border border-t-0 border-border bg-surface px-5 py-5">
              <div className="mb-5">
                <h3 className="text-[13px] font-medium text-ink mb-1">Schools</h3>
                <p className="text-[12px] text-ink-2 leading-relaxed">
                  Special pricing for inclusive and special schools. Give every teacher
                  access, with your school&apos;s branding on every printed schedule.
                </p>
              </div>
              <div className="mb-5">
                <h3 className="text-[13px] font-medium text-ink mb-1">Therapy Centres &amp; Therapists</h3>
                <p className="text-[12px] text-ink-2 leading-relaxed">
                  OT, behaviour, speech or a full centre — we have good deals for
                  practitioners. Share schedules with the families you work with,
                  branded as yours.
                </p>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-[12px] text-ink-2 mb-3">
                  Leave your details and we&apos;ll get back to you with pricing.
                </p>
                <div className="space-y-2">
                  <input
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 border border-input-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent"
                  />
                  <input
                    value={leadOrg}
                    onChange={(e) => setLeadOrg(e.target.value)}
                    placeholder="School or centre name"
                    className="w-full px-3 py-2 border border-input-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent"
                  />
                  <input
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="Phone / WhatsApp"
                    inputMode="tel"
                    className="w-full px-3 py-2 border border-input-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent"
                  />
                  <input
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                    className="w-full px-3 py-2 border border-input-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent"
                  />
                  <textarea
                    value={leadNote}
                    onChange={(e) => setLeadNote(e.target.value)}
                    placeholder="How many teachers or therapists? Anything else we should know?"
                    rows={3}
                    className="w-full px-3 py-2 border border-input-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent resize-y"
                  />
                </div>
                <button
                  onClick={() => {
                    const subject = `Partnership enquiry — ${leadOrg || leadName || "School / Centre"}`;
                    const body = [
                      `Name: ${leadName}`,
                      `School / Centre: ${leadOrg}`,
                      `Phone / WhatsApp: ${leadPhone}`,
                      `Email: ${leadEmail}`,
                      "",
                      leadNote,
                    ].join("\n");
                    window.location.href =
                      `mailto:visualschedulesofficial@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  }}
                  disabled={!leadName.trim() || !(leadPhone.trim() || leadEmail.trim())}
                  className="w-full mt-3 text-[12px] tracking-wider uppercase py-2.5 bg-accent text-white border border-accent font-medium font-sans hover:bg-accent-hover transition-all disabled:opacity-50"
                >
                  Send enquiry
                </button>
                <p className="text-[11px] text-ink-3 mt-2 text-center leading-relaxed">
                  This opens your email app with the details filled in. Or write to us
                  directly at visualschedulesofficial@gmail.com
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Reassurance */}
        <div className="bg-surface border border-border p-6 text-center max-w-lg mx-auto">
          <h3 className="text-[13px] font-medium text-ink mb-2">No surprises</h3>
          <p className="text-[12px] text-ink-2 leading-relaxed">
            All plans are one-time payments with no auto-renewal. When your plan expires, your free daily cards still work. UPI, debit cards, and credit cards accepted.
          </p>
        </div>
      </div></main>

      {/* Footer */}
      <footer className="bg-ink text-[#9A9690] px-7 py-4 flex items-center justify-between gap-4 flex-wrap text-xs max-md:px-4">
        <span className="font-serif text-base italic text-[#F5F2EC]">Grow Gently</span>
        <div className="flex items-center gap-4 flex-wrap">
          <Link href="/privacy" className="text-[#9A9690] no-underline hover:text-[#F5F2EC] transition-colors">Privacy</Link>
          <Link href="/terms" className="text-[#9A9690] no-underline hover:text-[#F5F2EC] transition-colors">Terms</Link>
          <Link href="/refund" className="text-[#9A9690] no-underline hover:text-[#F5F2EC] transition-colors">Refunds</Link>
        </div>
      </footer>
    </div>
  );
}
