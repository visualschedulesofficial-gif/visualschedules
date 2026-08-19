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
  const [audience, setAudience] = useState<"parents" | "orgs">("parents");
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadKind, setLeadKind] = useState("School");
  const [leadName, setLeadName] = useState("");
  const [leadOrg, setLeadOrg] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadCity, setLeadCity] = useState("");
  const [leadSeats, setLeadSeats] = useState("");
  const [leadNote, setLeadNote] = useState("");
  const [leadBusy, setLeadBusy] = useState(false);
  const [leadDone, setLeadDone] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);
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
            // Include the payment id and the real reason. Without these, a
            // stranded payment can't be traced without digging through the
            // Razorpay dashboard.
            const why = result?.error ? ` (${result.error})` : "";
            const ref = response?.razorpay_payment_id
              ? ` Reference: ${response.razorpay_payment_id}`
              : "";
            setPayMessage(
              `Payment received — your money is safe — but activation didn't complete${why}.` +
              ` Email visualschedulesofficial@gmail.com and we'll unlock it right away.${ref}`
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

  const leadValid =
    leadName.trim() && leadOrg.trim() && leadEmail.trim() && leadPhone.trim();

  async function submitLead() {
    if (!leadValid) return;
    setLeadBusy(true);
    setLeadError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadName, org: leadOrg, kind: leadKind, email: leadEmail,
          phone: leadPhone, city: leadCity, seats: leadSeats, message: leadNote,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setLeadDone(true);
      } else {
        setLeadError(data?.error || "Could not send. Please try again.");
      }
    } catch {
      setLeadError("Could not send — check your connection.");
    }
    setLeadBusy(false);
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
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl italic text-ink mb-3">
            Plans and pricing
          </h1>
          <p className="text-[14px] text-ink-2 max-w-md mx-auto leading-relaxed">
            The daily category is always free. Unlock every category — no auto-renewal, ever.
          </p>
        </div>

        {/* Audience toggle — parents buy a plan, organisations talk to us.
            No monthly/yearly switch: these are fixed one-off durations. */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-surface border border-border rounded-full p-1">
            <button
              onClick={() => setAudience("parents")}
              className={`px-5 py-2 rounded-full text-[13px] font-medium font-sans transition-all ${
                audience === "parents" ? "bg-accent text-white" : "text-ink-2 hover:text-ink"
              }`}
            >
              Parents
            </button>
            <button
              onClick={() => setAudience("orgs")}
              className={`px-5 py-2 rounded-full text-[13px] font-medium font-sans transition-all ${
                audience === "orgs" ? "bg-accent text-white" : "text-ink-2 hover:text-ink"
              }`}
            >
              Schools &amp; Therapy Centres
            </button>
          </div>
        </div>

        {payMessage && (
          <div className="max-w-[560px] mx-auto mb-6 px-4 py-3 rounded bg-[#E8EDE0] text-[#4A5A3E] text-[14px] text-center font-sans">
            {payMessage}
          </div>
        )}

        {audience === "parents" ? (
          <>
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

          </>
        ) : (
          /* Schools & therapy centres — no prices; these are quoted per
             organisation, so both cards lead to one contact form. */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 max-w-3xl mx-auto">
            {[
              {
                kind: "School",
                eyebrow: "Inclusive & special schools",
                title: "Schools",
                body: "Special pricing for inclusive and special schools. Give every teacher access, with your school's branding on every printed schedule.",
                points: [
                  "Access for every teacher",
                  "Your school's logo on every schedule",
                  "All paid categories unlocked",
                  "One code for your whole team",
                ],
              },
              {
                kind: "Therapy centre",
                eyebrow: "OT, behaviour, speech",
                title: "Therapy Centres & Therapists",
                body: "OT, behaviour, speech or a full centre — we have good deals for practitioners. Share schedules with the families you work with, branded as yours.",
                points: [
                  "Access for every therapist",
                  "Your centre's branding on schedules",
                  "All paid categories unlocked",
                  "Share with the families you support",
                ],
              },
            ].map((card) => (
              <div key={card.kind} className="bg-surface border border-border p-6 flex flex-col">
                <span className="text-[11px] tracking-wider uppercase text-ink-3 font-medium">{card.eyebrow}</span>
                <h2 className="font-serif text-xl italic text-ink mt-2 mb-2">{card.title}</h2>
                <p className="text-[13px] text-ink-2 leading-relaxed mb-4">{card.body}</p>

                <div className="mb-5">
                  <div className="font-serif text-2xl italic text-ink">Let&apos;s talk</div>
                  <p className="text-[12px] text-ink-3 mt-1">Get in touch for pricing</p>
                </div>

                <ul className="list-none p-0 m-0 mb-5 flex-1">
                  {card.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 mb-2 text-[12px] text-ink-2 leading-snug">
                      <svg className="w-3.5 h-3.5 mt-0.5 stroke-accent stroke-[2.4] fill-none shrink-0" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {pt}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => { setLeadKind(card.kind); setShowLeadForm(true); }}
                  className="w-full text-[12px] tracking-wider uppercase py-3 bg-accent text-white border border-accent font-medium font-sans hover:bg-accent-hover transition-all"
                >
                  Contact us
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Reassurance */}
        <div className="bg-surface border border-border p-6 text-center max-w-lg mx-auto">
          <h3 className="text-[13px] font-medium text-ink mb-2">No surprises</h3>
          <p className="text-[12px] text-ink-2 leading-relaxed">
            All plans are one-time payments with no auto-renewal. When your plan expires, your free daily cards still work. UPI, debit cards, and credit cards accepted.
          </p>
        </div>
      </div></main>

      {/* Contact form — saved to the database so enquiries land in Admin and
          can't be lost, rather than depending on the visitor's email app. */}
      {showLeadForm && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(28,27,25,0.5)" }}
          onClick={() => { setShowLeadForm(false); setLeadDone(false); }}
        >
          <div
            className="bg-surface border border-border p-6 w-full max-w-md my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {leadDone ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-badge-free-bg flex items-center justify-center">
                  <svg className="w-6 h-6 stroke-accent stroke-[2.4] fill-none" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="font-serif text-xl italic text-ink mb-2">Thank you</h2>
                <p className="text-[13px] text-ink-2 leading-relaxed mb-5">
                  We&apos;ve got your details and will be in touch shortly with pricing.
                </p>
                <button
                  onClick={() => { setShowLeadForm(false); setLeadDone(false); }}
                  className="text-[12px] tracking-wider uppercase px-6 py-2.5 bg-accent text-white border border-accent font-medium font-sans"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-serif text-xl italic text-ink mb-1">Tell us about your {leadKind.toLowerCase()}</h2>
                <p className="text-[12px] text-ink-2 mb-4">
                  We&apos;ll come back with pricing and set up your branding.
                </p>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] tracking-widest uppercase text-[#5C5855] mb-1 block font-medium">
                      I am a *
                    </label>
                    <select
                      value={leadKind}
                      onChange={(e) => setLeadKind(e.target.value)}
                      className="w-full px-3 py-2 border border-input-border bg-white font-sans text-[13px] text-ink outline-none focus:border-accent"
                    >
                      <option>School</option>
                      <option>Therapy centre</option>
                      <option>Individual therapist</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] tracking-widest uppercase text-[#5C5855] mb-1 block font-medium">
                      Your name *
                    </label>
                    <input
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      className="w-full px-3 py-2 border border-input-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] tracking-widest uppercase text-[#5C5855] mb-1 block font-medium">
                      School / centre name *
                    </label>
                    <input
                      value={leadOrg}
                      onChange={(e) => setLeadOrg(e.target.value)}
                      className="w-full px-3 py-2 border border-input-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] tracking-widest uppercase text-[#5C5855] mb-1 block font-medium">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-input-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] tracking-widest uppercase text-[#5C5855] mb-1 block font-medium">
                      Phone / WhatsApp *
                    </label>
                    <input
                      inputMode="tel"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-input-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] tracking-widest uppercase text-[#5C5855] mb-1 block font-medium">
                        City
                      </label>
                      <input
                        value={leadCity}
                        onChange={(e) => setLeadCity(e.target.value)}
                        className="w-full px-3 py-2 border border-input-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] tracking-widest uppercase text-[#5C5855] mb-1 block font-medium">
                        How many staff
                      </label>
                      <input
                        value={leadSeats}
                        onChange={(e) => setLeadSeats(e.target.value)}
                        placeholder="e.g. 12"
                        className="w-full px-3 py-2 border border-input-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] tracking-widest uppercase text-[#5C5855] mb-1 block font-medium">
                      Anything else
                    </label>
                    <textarea
                      value={leadNote}
                      onChange={(e) => setLeadNote(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-input-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent resize-y"
                    />
                  </div>
                </div>

                {leadError && <p className="text-[12px] text-[#C53030] mt-3">{leadError}</p>}

                <p className="text-[11px] text-ink-3 mt-3">* required</p>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setShowLeadForm(false)}
                    className="flex-1 text-[12px] tracking-wider uppercase py-2.5 border border-border text-ink-2 font-medium font-sans hover:border-ink hover:text-ink transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitLead}
                    disabled={leadBusy || !leadValid}
                    className="flex-1 text-[12px] tracking-wider uppercase py-2.5 bg-accent text-white border border-accent font-medium font-sans hover:bg-accent-hover transition-all disabled:opacity-50"
                  >
                    {leadBusy ? "Sending…" : "Send enquiry"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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

