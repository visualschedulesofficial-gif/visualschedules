"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
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
    id: "3mo",
    name: "3 Months",
    price: "₹399",
    period: "3 months",
    perMonth: "₹133/month",
    description: "Great for getting started",
    features: [
      "Everything in Free",
      "All paid categories unlocked",
      "School, Therapy, Meals",
      "Social, Art, Home",
      "Any new categories added",
    ],
    cta: "Subscribe — ₹399",
    highlight: false,
    isFree: false,
  },
  {
    id: "6mo",
    name: "6 Months",
    price: "₹699",
    period: "6 months",
    perMonth: "₹117/month",
    description: "Settle into a rhythm",
    features: [
      "Everything in Free",
      "All paid categories unlocked",
      "School, Therapy, Meals",
      "Social, Art, Home",
      "Any new categories added",
    ],
    cta: "Subscribe — ₹699",
    highlight: true, // Most popular
    isFree: false,
  },
  {
    id: "12mo",
    name: "12 Months",
    price: "₹1,199",
    period: "12 months",
    perMonth: "₹100/month",
    badge: "Best Value",
    description: "A full year of calmer days",
    features: [
      "Everything in Free",
      "All paid categories unlocked",
      "School, Therapy, Meals",
      "Social, Art, Home",
      "Any new categories added",
    ],
    cta: "Subscribe — ₹1,199",
    highlight: false,
    isFree: false,
  },
];

export default function PlansPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null));
  }, []);

  function handleSubscribeClick(planId: string) {
    if (!user) {
      // Prompt sign-in first
      window.location.href = `/login?next=/plans`;
      return;
    }
    // TODO: Open Razorpay checkout for selected plan
    alert(`Razorpay checkout for ${planId} — wiring up soon.`);
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Nav */}
      <nav className="h-[56px] md:h-[66px] bg-surface border-b border-border flex items-center justify-between px-4 md:px-7 shrink-0">
        <Link href="/schedule" className="font-serif text-base md:text-2xl italic text-ink no-underline leading-none">
          Visual Schedules
        </Link>
        {!user ? (
          <Link
            href="/login"
            className="text-[11px] tracking-wider uppercase px-4 py-[0.42rem] border border-border text-[#4A4540] no-underline font-medium font-sans hover:border-ink hover:text-ink transition-all"
          >
            Sign In
          </Link>
        ) : (
          <Link
            href="/schedules"
            className="text-[11px] tracking-wider uppercase px-4 py-[0.42rem] border border-border text-[#4A4540] no-underline font-medium font-sans hover:border-ink hover:text-ink transition-all"
          >
            My Schedules
          </Link>
        )}
      </nav>

      <main className="flex-1 px-4 py-12 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl italic text-ink mb-3">
            Simple, honest pricing
          </h1>
          <p className="text-[14px] text-ink-2 max-w-md mx-auto leading-relaxed">
            The daily category is always free. Subscribe to unlock every category — no auto-renewal, ever.
          </p>
        </div>

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
                  <span className="text-[10px] tracking-wider uppercase font-semibold bg-accent text-white px-3 py-1">
                    Most Popular
                  </span>
                </div>
              )}
              {plan.badge && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <span className="text-[10px] tracking-wider uppercase font-semibold bg-[#A8824A] text-white px-3 py-1">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="p-5 flex flex-col flex-1">
                {/* Plan name + price */}
                <div className="mb-4 pb-4 border-b border-border">
                  <h2 className="text-[11px] tracking-wider uppercase font-semibold text-ink-3 mb-2">
                    {plan.name}
                  </h2>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif text-3xl italic text-ink">{plan.price}</span>
                    <span className="text-[12px] text-ink-3">/ {plan.period}</span>
                  </div>
                  {plan.perMonth && (
                    <p className="text-[11px] text-ink-3 mt-1">{plan.perMonth}</p>
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
                    className="w-full text-center text-[11px] tracking-wider uppercase py-2.5 border border-border text-[#4A4540] no-underline font-medium font-sans hover:border-ink hover:text-ink transition-all block"
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <button
                    onClick={() => handleSubscribeClick(plan.id)}
                    className={`w-full text-[11px] tracking-wider uppercase py-2.5 font-medium font-sans transition-all ${
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

        {/* Reassurance */}
        <div className="bg-surface border border-border p-6 text-center max-w-lg mx-auto">
          <h3 className="text-[13px] font-medium text-ink mb-2">No surprises</h3>
          <p className="text-[12px] text-ink-2 leading-relaxed">
            All plans are one-time payments with no auto-renewal. When your plan expires, your free daily cards still work. UPI, debit cards, and credit cards accepted.
          </p>
        </div>
      </main>

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
